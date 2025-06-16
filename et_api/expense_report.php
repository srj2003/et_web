<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch roles
        if (isset($_GET['fetch_roles']) && $_GET['fetch_roles'] === 'true') {
            $query = "SELECT role_id, role_name FROM user_role WHERE role_is_del = 0";
            $stmt = $pdo->query($query);
            $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'roles' => array_map(function ($role) {
                    return [
                        'value' => $role['role_id'],
                        'label' => $role['role_name'],
                    ];
                }, $roles),
            ]);
            exit;
        }

        // Fetch users based on role
        if (isset($_GET['role_id'])) {
            $roleId = (int) $_GET['role_id'];
            error_log("Fetching users for Role ID: " . $roleId);

            $query = "
            SELECT 
                ud.u_id,
                CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS name
            FROM user_details ud
            LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
            LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
            WHERE ar.role_id = :role_id AND ud.u_is_del = 0
        ";


            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);

            try {
                $stmt->execute();
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Fetched Users: " . json_encode($users));

                echo json_encode([
                    'status' => 'success',
                    'users' => $users,
                ]);
            } catch (PDOException $e) {
                error_log("Query Error: " . $e->getMessage());
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to fetch users.',
                ]);
            }
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        $creatorId = $data['creator_id'] ?? null;
        $expenseType = $data['expense_type'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;

        // Only check expense_type as required
        if (!$expenseType) {
            echo json_encode(['error' => 'Missing required parameter: expense_type']);
            exit;
        }

        // Build WHERE clause dynamically
        $whereConditions = ["e.expense_type_id = :expense_type"];

        // Add creator_id condition only if provided
        if ($creatorId) {
            $whereConditions[] = "e.expense_track_created_by = :creator_id";
        }

        // Add date range condition if provided
        if ($startDate && $endDate) {
            $whereConditions[] = "DATE(e.expense_track_created_at) BETWEEN :start_date AND :end_date";
        }

        // Add status condition
        $whereConditions[] = "e.expense_track_status = 1";

        // Combine conditions
        $whereClause = "WHERE " . implode(" AND ", $whereConditions);

        // Update the query
        $query = "
            SELECT 
                e.expense_track_id,
                e.expense_track_title,
                e.expense_type_id,
                e.expense_total_amount,
                e.expense_track_status,
                e.expense_track_app_rej_remarks,
                e.expense_track_created_at,
                e.expense_track_created_by,
                e.expense_track_submitted_to,
                e.expense_track_approved_rejected_by,
                e.expense_track_approved_rejected_at,
                CONCAT(creator.u_fname, ' ', creator.u_lname) as created_by_full_name,
                CONCAT(submitter.u_fname, ' ', submitter.u_lname) as submitted_to_full_name,
                CONCAT(approver.u_fname, ' ', approver.u_lname) as approved_rejected_by_full_name,
                ed.expense_id,
                ed.expense_head_id,
                eh.expense_head_title,
                ed.expense_product_name as expense_product_name,
                ed.expense_product_qty,
                ed.expense_product_unit,
                ed.expense_product_desc,
                ed.expense_product_photo_path,
                ed.expense_product_bill_photo_path,
                ed.expense_product_sl_no,
                ed.expense_product_amount,
                ed.expense_bill_date,
                ed.expense_product_created_at as expense_product_created_at,
                ed.expense_product_updated_at,
                ed.expense_product_is_del,
                ur.role_name
            FROM 
                expense_track_details e 
            LEFT JOIN 
                user_details creator ON e.expense_track_created_by = creator.u_id
            LEFT JOIN 
                user_details submitter ON e.expense_track_submitted_to = submitter.u_id
            LEFT JOIN 
                user_details approver ON e.expense_track_approved_rejected_by = approver.u_id
            LEFT JOIN
                expense_details ed ON e.expense_track_id = ed.expense_track_id
            LEFT JOIN
                expense_heads eh ON ed.expense_head_id = eh.expense_head_id
            LEFT JOIN
                assigned_role ar ON creator.u_id = ar.u_id
            LEFT JOIN
                user_role ur ON ar.role_id = ur.role_id
            $whereClause
            ORDER BY 
                e.expense_track_created_at DESC
        ";

        $stmt = $pdo->prepare($query);

        // Bind parameters conditionally
        $stmt->bindValue(':expense_type', $expenseType, PDO::PARAM_INT);
        if ($creatorId) {
            $stmt->bindValue(':creator_id', $creatorId, PDO::PARAM_INT);
        }
        if ($startDate && $endDate) {
            $stmt->bindValue(':start_date', $startDate, PDO::PARAM_STR);
            $stmt->bindValue(':end_date', $endDate, PDO::PARAM_STR);
        }

        $stmt->execute();

        // Group expenses by expense_track_id
        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $expenseId = $row['expense_track_id'];
            if (!isset($results[$expenseId])) {
                // Create main expense entry
                $results[$expenseId] = [
                    'expense_track_id' => $row['expense_track_id'],
                    'expense_track_title' => $row['expense_track_title'],
                    'expense_type_id' => $row['expense_type_id'],
                    'expense_total_amount' => $row['expense_total_amount'],
                    'expense_track_status' => $row['expense_track_status'],
                    'expense_track_app_rej_remarks' => $row['expense_track_app_rej_remarks'],
                    'expense_track_created_at' => $row['expense_track_created_at'],
                    'expense_track_created_by' => $row['expense_track_created_by'],
                    'created_by_full_name' => $row['created_by_full_name'],
                    'expense_track_submitted_to' => $row['expense_track_submitted_to'],
                    'submitted_to_full_name' => $row['submitted_to_full_name'],
                    'expense_track_approved_rejected_by' => $row['expense_track_approved_rejected_by'],
                    'approved_rejected_by_full_name' => $row['approved_rejected_by_full_name'],
                    'expense_track_approved_rejected_at' => $row['expense_track_approved_rejected_at'],
                    'role_name' => $row['role_name'],
                    'expense_items' => []
                ];
            }

            // Add expense item if it exists
            if ($row['expense_id']) {
                $results[$expenseId]['expense_items'][] = [
                    'expense_id' => $row['expense_id'],
                    'expense_head_id' => $row['expense_head_id'],
                    'expense_head_title' => $row['expense_head_title'],
                    'expense_product_name' => $row['expense_product_name'],
                    'expense_product_qty' => $row['expense_product_qty'],
                    'expense_product_unit' => $row['expense_product_unit'],
                    'expense_product_desc' => $row['expense_product_desc'],
                    'expense_product_photo_path' => $row['expense_product_photo_path'],
                    'expense_product_bill_photo_path' => $row['expense_product_bill_photo_path'],
                    'expense_product_sl_no' => $row['expense_product_sl_no'],
                    'expense_product_amount' => $row['expense_product_amount'],
                    'expense_bill_date' => $row['expense_bill_date'],
                    'expense_product_created_at' => $row['expense_product_created_at'],
                    'expense_product_updated_at' => $row['expense_product_updated_at'],
                    'expense_product_is_del' => $row['expense_product_is_del']
                ];
            }
        }

        // Convert associative array to indexed array
        $formattedResults = array_values($results);
        echo json_encode($formattedResults);
        exit;
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
