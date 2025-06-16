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
            error_log("Fetching users for Role ID: " . $roleId); // Debug log

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
                error_log("Fetched Users: " . json_encode($users)); // Debug log

                echo json_encode([
                    'status' => 'success',
                    'users' => $users,
                ]);
            } catch (PDOException $e) {
                error_log("Query Error: " . $e->getMessage()); // Debug log
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to fetch users.',
                ]);
            }
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Fetch requisition details for a specific user
        // Fetch requisition details
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        $userId = $data['user_id'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;

        $whereConditions = [];

        // Add user ID condition if provided
        if ($userId) {
            $whereConditions[] = "requisition_created_by = :user_id";
        }

        // Add date range condition if provided
        if ($startDate && $endDate) {
            $whereConditions[] = "(DATE(requisition_created_at) BETWEEN :start_date AND :end_date OR DATE(requisition_updated_at) BETWEEN :start_date AND :end_date)";
        }

        $whereClause = count($whereConditions) > 0 ? "WHERE " . implode(" AND ", $whereConditions) : "";

        $query = "
    SELECT 
        requisition_id,
        requisition_title,
        requisition_req_amount,
        requisition_app_amount,
        requisition_status,
        requisition_created_by,
        requisition_submitted_to,
        requisition_create_lat,
        requisition_create_long,
        requisition_created_at,
        requisition_updated_at
    FROM expense_requisition_details 
	WHERE requisition_status = 1";

        // Add additional conditions if they exist
        if ($userId) {
            $query .= " AND requisition_created_by = :user_id";
        }

        if ($startDate && $endDate) {
            $query .= " AND (DATE(requisition_created_at) BETWEEN :start_date AND :end_date 
                OR DATE(requisition_updated_at) BETWEEN :start_date AND :end_date)";
        }

        $stmt = $pdo->prepare($query);

        // Bind parameters
        if ($userId) {
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        }
        if ($startDate && $endDate) {
            $stmt->bindValue(':start_date', $startDate, PDO::PARAM_STR);
            $stmt->bindValue(':end_date', $endDate, PDO::PARAM_STR);
        }

        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'data' => $results,
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
