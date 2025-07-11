<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'auth.php';

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Authenticate user using PDO (for token check only)
try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }
    $authenticated_user_id = $auth['user_id'];
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication server error: ' . $e->getMessage()
    ]);
    exit;
}

// ==========================
// 🔍 HANDLE FETCH REQUESTS
// ==========================

// 1. Fetch Expense Types
if (isset($_GET['fetch_expense_types']) && $_GET['fetch_expense_types'] === 'true') {
    $result = $conn->query("SELECT expense_type_id, expense_type_name FROM expense_types");
    $types = [];

    while ($row = $result->fetch_assoc()) {
        $types[] = [
            "label" => $row["expense_type_name"],
            "value" => $row["expense_type_id"]
        ];
    }

    echo json_encode(['status' => 'success', 'data' => $types]);
    exit;
}

// 2. Fetch Expense Heads
if (isset($_GET['fetch_expense_heads']) && $_GET['fetch_expense_heads'] === 'true') {
    $result = $conn->query("SELECT expense_head_id, expense_head_title FROM expense_heads");
    $heads = [];

    while ($row = $result->fetch_assoc()) {
        $heads[] = [
            "label" => $row["expense_head_title"],
            "value" => $row["expense_head_id"]
        ];
    }

    echo json_encode(['status' => 'success', 'data' => $heads]);
    exit;
}

// 3. Fetch Roles
if (isset($_GET['fetch_roles']) && $_GET['fetch_roles'] === 'true') {
    $query = "SELECT role_id, role_name FROM user_role WHERE role_is_del = 0";
    $result = $conn->query($query);
    $roles = [];

    while ($row = $result->fetch_assoc()) {
        $roles[] = [
            'value' => $row['role_id'],
            'label' => $row['role_name']
        ];
    }

    echo json_encode(['status' => 'success', 'roles' => $roles]);
    exit;
}

// 4. Fetch Users By Role
if (isset($_GET['role_id'])) {
    $roleId = (int) $_GET['role_id'];
    $query = "
        SELECT 
            ud.u_id,
            CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS name
        FROM user_details ud
        LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
        LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
        WHERE ar.role_id = ? AND ud.u_is_del = 0
    ";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $roleId);
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];

    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => $row['u_id'],
            'name' => $row['name']
        ];
    }

    echo json_encode(['status' => 'success', 'users' => $users]);
    exit;
}

// ==========================
// 📦 HANDLE EXPENSE SUBMISSION
// ==========================

function handleFileUpload($file, $folder, $prefix) {
    if (!$file || !isset($file['tmp_name']) || empty($file['tmp_name'])) {
        return '';
    }

    if (!file_exists($folder)) {
        mkdir($folder, 0755, true);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $prefix . uniqid() . '.' . $ext;
    $path = $folder . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $path)) {
        return $path;
    }
    
    return '';
}

try {
    // Check if it's a multipart form data request
    if (!isset($_POST['details'])) {
        throw new Exception("Invalid request format");
    }

    $conn->begin_transaction();

    // --- Project Purpose Auto-Approval Logic ---
    $is_project_purpose = false;
    $auto_approved = 0;
    $auto_approve_reason = '';
    if (isset($_POST['expense_type_id'])) {
        $expense_type_id = $_POST['expense_type_id'];
        $stmt = $conn->prepare("SELECT expense_type_name FROM expense_types WHERE expense_type_id = ? LIMIT 1");
        $stmt->bind_param("i", $expense_type_id);
        $stmt->execute();
        $stmt->bind_result($label);
        if ($stmt->fetch()) {
            if (strtolower(trim($label)) === 'project purpose') {
                $is_project_purpose = true;
            }
        }
        $stmt->close();
    }
    // --- End Project Purpose Check ---

    // Parse the details JSON
    $details = json_decode($_POST['details'], true);
    if (!$details) {
        throw new Exception("Invalid details format");
    }

    // Check if auto-approval should be applied
    $shouldAutoApprove = false;
    $autoApproveReason = "";
    
    // Get user's daily limit
    $limitQuery = "SELECT total_expense_amount FROM userwise_expense_amount WHERE u_id = ?";
    $limitStmt = $conn->prepare($limitQuery);
    $limitStmt->bind_param("s", $authenticated_user_id);
    $limitStmt->execute();
    $limitResult = $limitStmt->get_result();
    
    if ($limitResult->num_rows > 0) {
        $limitRow = $limitResult->fetch_assoc();
        $dailyLimit = (float)$limitRow['total_expense_amount'];
        
        // Get today's total expenses
        $today = date('Y-m-d');
        $todayQuery = "SELECT SUM(expense_total_amount) as today_total 
                      FROM expense_track_details 
                      WHERE expense_track_created_by = ? 
                      AND DATE(expense_track_created_at) = ?";
        $todayStmt = $conn->prepare($todayQuery);
        $todayStmt->bind_param("ss", $authenticated_user_id, $today);
        $todayStmt->execute();
        $todayResult = $todayStmt->get_result();
        
        if ($todayResult->num_rows > 0) {
            $todayRow = $todayResult->fetch_assoc();
            $todayTotal = (float)$todayRow['today_total'] ?? 0;
            $proposedTotal = $todayTotal + (float)$_POST['expense_total_amount'];
            
            // Auto-approve if the total doesn't exceed the daily limit
            if ($proposedTotal <= $dailyLimit) {
                $shouldAutoApprove = true;
                $autoApproveReason = "Auto-approved: Total daily expense (₹{$proposedTotal}) within limit (₹{$dailyLimit})";
            }
        }
    }

    // --- Project Purpose overrides auto-approval ---
    if ($is_project_purpose) {
        $shouldAutoApprove = true;
        $auto_approved = 1;
        $autoApproveReason = "Auto-approved because 'Project Purpose' was selected";
    }
    // --- End Project Purpose override ---

    // Insert master entry
    $stmt = $conn->prepare("
            INSERT INTO expense_track_details (
                expense_track_parent_id,
                expense_track_root_id,
                expense_track_title,
                expense_type_id,
                expense_total_amount,
                expense_track_app_rej_remarks,
                expense_track_create_lat,
                expense_track_create_long,
                expense_track_created_by,
                expense_track_submitted_to,
                expense_track_status,
                expense_track_approved_by,
                expense_track_approved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $parentId = 0;
        $trackRootId = 0;
        $status = $shouldAutoApprove ? 1 : null; // 1 for approved, null for pending
        $approvedBy = $shouldAutoApprove ? $authenticated_user_id : null;
        $approvedAt = $shouldAutoApprove ? date('Y-m-d H:i:s') : null;
        
        $stmt->bind_param(
            "iisidsssiiss",
            $parentId,
            $trackRootId,
            $_POST['expense_track_title'],
            $_POST['expense_type_id'],
            $_POST['expense_total_amount'],
            $autoApproveReason,
            $_POST['expense_track_create_lat'],
            $_POST['expense_track_create_long'],
            $authenticated_user_id,
            $_POST['expense_track_submitted_to'],
            $status,
            $approvedBy,
            $approvedAt
        );

        $stmt->execute();
        $trackId = $conn->insert_id;

        // Check if this is a "Project Purpose" expense that should auto-approve
        $auto_approve = false;
        if ($_POST['expense_type_id'] == 1) {
            $auto_approve = true;
        } else {
            // Double check by name if ID wasn't 1
            $type_check = $conn->query("SELECT expense_type_name FROM expense_types WHERE expense_type_id = {$_POST['expense_type_id']} LIMIT 1");
            if ($type_check && $type_row = $type_check->fetch_assoc()) {
                if (strtolower(trim($type_row['expense_type_name'])) === 'project purpose') {
                    $auto_approve = true;
                }
            }
        }

        if ($auto_approve) {
            // Auto-approve the expense immediately
            $approve_sql = "UPDATE expense_track_details 
                           SET expense_track_status = 1,
                               expense_track_approved_rejected_by = {$_POST['expense_track_submitted_to']},
                               expense_track_approved_rejected_at = NOW()
                           WHERE expense_track_id = $trackId";
            $conn->query($approve_sql);
        }

        // Update root ID
        $conn->query("UPDATE expense_track_details SET expense_track_root_id = $trackId WHERE expense_track_id = $trackId");

        // Create upload directories
        $userId = $authenticated_user_id;
        $prodBillDir = "upoads/prod_bill_photo/$userId";
        $prodPhotoDir = "upoads/prod_photo/$userId";

        if (!is_dir($prodBillDir)) mkdir($prodBillDir, 0755, true);
        if (!is_dir($prodPhotoDir)) mkdir($prodPhotoDir, 0755, true);

        // Process each detail
        foreach ($details as $index => $detail) {
            $billPath = '';
            $photoPath = '';

            // Handle bill file
            if (isset($_FILES["bill_file_$index"])) {
                $billFile = $_FILES["bill_file_$index"];
                $billExt = pathinfo($billFile['name'], PATHINFO_EXTENSION);
                $billName = "bill_" . uniqid() . ".$billExt";
                move_uploaded_file($billFile['tmp_name'], "$prodBillDir/$billName");
                $billPath = "upoads/prod_bill_photo/$userId/$billName";
            }

            // Handle product image
            if (isset($_FILES["product_image_$index"])) {
                $imageFile = $_FILES["product_image_$index"];
                $imageExt = pathinfo($imageFile['name'], PATHINFO_EXTENSION);
                $imageName = "photo_" . uniqid() . ".$imageExt";
                move_uploaded_file($imageFile['tmp_name'], "$prodPhotoDir/$imageName");
                $photoPath = "upoads/prod_photo/$userId/$imageName";
            }

            // Insert detail record
            $detailStmt = $conn->prepare("
                INSERT INTO expense_details (
                    expense_track_id,
                    expense_head_id,
                    expense_product_name,
                    expense_product_qty,
                    expense_product_unit,
                    expense_product_desc,
                    expense_product_photo_path,
                    expense_product_bill_photo_path,
                    expense_product_sl_no,
                    expense_product_amount,
                    expense_bill_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $detailStmt->bind_param(
                "iisisssssds",
                $trackId,
                $detail['expense_head_id'],
                $detail['expense_product_name'],
                $detail['expense_product_qty'],
                $detail['expense_product_unit'],
                $detail['expense_product_desc'],
                $photoPath,
                $billPath,
                $detail['expense_product_sl_no'],
                $detail['expense_product_amount'],
                $detail['expense_bill_date']
            );

            $detailStmt->execute();
        }

        $conn->commit();
        $message = $shouldAutoApprove 
            ? "Expense submitted and auto-approved successfully!" 
            : "Expense submitted successfully! Pending approval.";
        
        // --- Optional: Notify submitted_to user if auto-approved and submitted_to is set ---
        if ($auto_approved && isset($_POST['expense_track_submitted_to']) && $_POST['expense_track_submitted_to'] != '') {
            $submitted_to_id = $_POST['expense_track_submitted_to'];
            $notif_msg = "An expense under 'Project Purpose' was auto-approved.";
            $notif_stmt = $conn->prepare("INSERT INTO notifications (u_id, message, created_at) VALUES (?, ?, NOW())");
            $notif_stmt->bind_param("is", $submitted_to_id, $notif_msg);
            $notif_stmt->execute();
            $notif_stmt->close();
        }
        // --- End notification ---
        
        echo json_encode([
            "status" => "success",
            "message" => $message,
            "trackId" => $trackId,
            "autoApproved" => $auto_approve || $shouldAutoApprove,
            "autoApproveReason" => $auto_approve ? 'Auto-approved as Project Purpose' : ($autoApproveReason ?? '')
        ]);

} catch (Exception $e) {
    $conn->rollback();
    error_log("Expense submission error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => $e->getMessage(),
        "debug" => $_FILES // Remove in production
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($detailStmt)) $detailStmt->close();
    $conn->close();
}
