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
// ðŸ” HANDLE FETCH REQUESTS
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
// ðŸ“¦ HANDLE EXPENSE SUBMISSION
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

        // Parse the details JSON
        $details = json_decode($_POST['details'], true);
        if (!$details) {
            throw new Exception("Invalid details format");
        }

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
                expense_track_submitted_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $parentId = 0;
        $trackRootId = 0;
        
        $stmt->bind_param(
            "iisidsssii",
            $parentId,
            $trackRootId,
            $_POST['expense_track_title'],
            $_POST['expense_type_id'],
            $_POST['expense_total_amount'],
            $_POST['expense_track_app_rej_remarks'],
            $_POST['expense_track_create_lat'],
            $_POST['expense_track_create_long'],
            $authenticated_user_id,
            $_POST['expense_track_submitted_to']
        );

        $stmt->execute();
        $trackId = $conn->insert_id;

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
       
       // ========================
$emails = [];

// Get "Submitted To" user info
$userStmt = $conn->prepare("SELECT u_email, CONCAT(u_fname, ' ', u_mname, ' ', u_lname) AS full_name FROM user_details WHERE u_id = ?");
$userStmt->bind_param("i", $_POST['expense_track_submitted_to']);
$userStmt->execute();
$userRes = $userStmt->get_result();

$submittedToEmail = '';
$submittedToName = 'Unknown';
$submittedToId = $_POST['expense_track_submitted_to'];

if ($userRow = $userRes->fetch_assoc()) {
    $submittedToEmail = $userRow['u_email'];
    $submittedToName = $userRow['full_name'];
}
$userStmt->close();

// Get "Submitted By" user name
$submitByStmt = $conn->prepare("SELECT CONCAT(u_fname, ' ', u_mname, ' ', u_lname) AS full_name FROM user_details WHERE u_id = ?");
$submitByStmt->bind_param("i", $authenticated_user_id);
$submitByStmt->execute();
$submitRes = $submitByStmt->get_result();

$submittedByName = "Unknown";
if ($submitRow = $submitRes->fetch_assoc()) {
    $submittedByName = $submitRow['full_name'];
}
$submitByStmt->close();

// Get role-based emails for roles 1,2,8
$roleQuery = "
    SELECT DISTINCT ud.u_email 
    FROM user_details ud 
    JOIN assigned_role ar ON ud.u_id = ar.u_id 
    WHERE ar.role_id IN (1, 2, 8) 
    AND ar.ass_role_del = 0 
    AND ud.u_is_del = 0
";
$result = $conn->query($roleQuery);
while ($row = $result->fetch_assoc()) {
    if (!in_array($row['u_email'], $emails)) {
        $emails[] = $row['u_email'];
    }
}

// BCC & CC setup
$to = $submittedToEmail ?: 'no-reply@geomaticx.com';
$bcc = implode(',', array_diff($emails, [$submittedToEmail]));
$cc = ''; // example: 'finance@geomaticx.com'

// Dynamic expense view link
$expenseLink = "https://geomaticx.com/view-expense.php?id=" . $trackId;

$subject = "?? New Expense Submission";

// Email HTML body
$body = "
<html>
<head>
  <style>
    body { background-color: #f4f4f4; font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .card {
      background-color: #ffffff;
      border-radius: 10px;
      max-width: 600px;
      margin: auto;
      padding: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .header img {
      max-width: 120px;
      margin-bottom: 10px;
    }
    h2 {
      color: #2c3e50;
    }
    p {
      font-size: 15px;
      color: #333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #3498db;
      color: #fff !important;
      text-decoration: none;
      border-radius: 5px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #aaa;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <img src='https://geomaticx.com/logo.png' alt='Geomaticx Logo'>
      <h2>New Expense Submission</h2>
    </div>
    <p><strong>Title:</strong> {$_POST['expense_track_title']}</p>
    <p><strong>Amount:</strong> ?{$_POST['expense_total_amount']}</p>
    <p><strong>Remarks:</strong> {$_POST['expense_track_app_rej_remarks']}</p>
    <p><strong>Submitted By:</strong> {$submittedByName} (User ID {$authenticated_user_id})</p>
    <p><strong>Submitted To:</strong> {$submittedToName} (User ID {$submittedToId})</p>

    <a href='{$expenseLink}' class='button'>?? View Expense</a>

    <div class='footer'>
      &copy; " . date('Y') . " Geomaticx Technical Services Pvt. Ltd. | This is an automated notification.
    </div>
  </div>
</body>
</html>
";

// Email Headers
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Geomaticx <no-reply@geomaticx.com>\r\n";
if (!empty($cc)) $headers .= "Cc: $cc\r\n";
if (!empty($bcc)) $headers .= "Bcc: $bcc\r\n";

// Send mail
mail($to, $subject, $body, $headers);

        $conn->commit();
        echo json_encode([
            "status" => "success",
            "message" => "Expense entry recorded successfully",
            "trackId" => $trackId
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
