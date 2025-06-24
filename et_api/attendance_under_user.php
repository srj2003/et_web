<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get userId from POST body
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['userId'] ?? null;
    if (!$userId) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing userId in request.'
        ]);
        exit;
    }

    // Step 1: Get all assignments for this user
    $stmt = $pdo->prepare('SELECT expense_type_id, proj_role_id FROM project_assignments WHERE u_id = :userId');
    $stmt->execute(['userId' => $userId]);
    $userAssignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $finalResults = [];
    $seen = [];
    foreach ($userAssignments as $assignment) {
        $expenseTypeId = $assignment['expense_type_id'];
        $initialRoleId = (int)$assignment['proj_role_id'];
        if ($initialRoleId === 3 || $initialRoleId === 1) {
            // Avoid duplicate queries for same expense_type_id and role_id
            $key = $expenseTypeId . '-' . $initialRoleId;
            if (isset($seen[$key])) continue;
            $seen[$key] = true;

            // Step 2: Build filter for other assignments in this project
            if ($initialRoleId === 3) {
                $roleFilter = 'pa.proj_role_id != 3';
            } else if ($initialRoleId === 1) {
                $roleFilter = 'pa.proj_role_id != 3 AND pa.proj_role_id != 1';
            } else {
                continue;
            }

            // Step 3: Fetch the relevant assignments
            $query = "
                SELECT 
                    pa.expense_type_id,
                    et.expense_type_name,
                    pa.proj_role_id AS project_role_id,
                    pr.role_name,
                    pa.u_id,
                    ud.u_fname,
                    ud.u_mname,
                    ud.u_lname,
                    ud.u_email,
                    ud.u_mob
                FROM project_assignments pa
                LEFT JOIN expense_types et ON pa.expense_type_id = et.expense_type_id
                LEFT JOIN project_roles pr ON pa.proj_role_id = pr.proj_role_id
                LEFT JOIN user_details ud ON pa.u_id = ud.u_id
                WHERE pa.expense_type_id = :expenseTypeId AND $roleFilter
            ";
            $stmt2 = $pdo->prepare($query);
            $stmt2->execute(['expenseTypeId' => $expenseTypeId]);
            $results = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            foreach ($results as $row) {
                // Join attendance_details for today
                $today = date('Y-m-d');
                $attnQuery = "SELECT is_logged_out FROM attendance_details WHERE user_id = :user_id AND DATE(login_timestamp) = :today LIMIT 1";
                $attnStmt = $pdo->prepare($attnQuery);
                $attnStmt->execute([
                    'user_id' => $row['u_id'],
                    'today' => $today
                ]);
                $attnRow = $attnStmt->fetch(PDO::FETCH_ASSOC);
                if ($attnRow && isset($attnRow['is_logged_out'])) {
                    $row['is_logged_out'] = $attnRow['is_logged_out'];
                } else {
                    $row['is_logged_out'] = 1;
                }

                // Add leave_track_status logic
                if ($row['is_logged_out'] == 1) {
                    // Check leave_track_details for today
                    $leaveQuery = "SELECT leave_track_status FROM leave_track_details WHERE leave_track_created_by = :uid AND :today BETWEEN leave_from_date AND leave_to_date LIMIT 1";
                    $leaveStmt = $pdo->prepare($leaveQuery);
                    $leaveStmt->execute([
                        'uid' => $row['u_id'],
                        'today' => $today
                    ]);
                    $leaveRow = $leaveStmt->fetch(PDO::FETCH_ASSOC);
                    if ($leaveRow && isset($leaveRow['leave_track_status'])) {
                        $row['leave_track_status'] = $leaveRow['leave_track_status'];
                    } else {
                        $row['leave_track_status'] = 0;
                    }
                } else {
                    $row['leave_track_status'] = 0;
                }
                $finalResults[] = $row;
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'data' => $finalResults
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
    exit;
}
