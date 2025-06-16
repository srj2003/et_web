<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include config and token verifier
require_once 'config.php';
require_once 'auth.php';

$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => null
];

try {
    // PDO connection
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $user_id = $auth['user_id'];

    // SQL query to fetch all leaves with employee names
    $stmt = $pdo->prepare("
        SELECT lt.*, ud.u_fname, ud.u_lname 
        FROM leave_track_details lt
        LEFT JOIN user_details ud ON lt.leave_track_created_by = ud.u_id
        ORDER BY lt.leave_track_created_at DESC
    ");
    $stmt->execute();
    $leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $jsonData = array();
    foreach ($leaves as $row) {
        // Map leave_ground values to human-readable text
        $leaveType = "";
        switch ($row['leave_ground']) {
            case 0:
                $leaveType = "Casual Leave";
                break;
            case 1:
                $leaveType = "Medical Leave";
                break;
            case 2:
                $leaveType = "Half Day Leave";
                break;
            default:
                $leaveType = "Unknown";
        }

        // Map leave_track_status values to human-readable text
        $status = "";
        switch ($row['leave_track_status']) {
            case null:
                $status = "Unattended";
                break;
            case 0:
                $status = "Rejected";
                break;
            case 1:
                $status = "Approved";
                break;
            case 2:
                $status = "Suspended";
                break;
            default:
                $status = "Unknown";
        }

        // Combine first and last name
        $employeeName = trim($row['u_fname'] . ' ' . $row['u_lname']);

        // Format the data for JSON response
        $jsonData[] = array(
            'leave_id' => $row['leave_id'],
            'leave_title' => $row['leave_title'],
            'leave_ground' => $row['leave_ground'],
            'leave_ground_text' => $leaveType,
            'leave_from_date' => $row['leave_from_date'],
            'leave_to_date' => $row['leave_to_date'],
            'leave_comment' => $row['leave_comment'],
            'leave_acpt_rql_remarks' => $row['leave_acpt_rql_remarks'],
            'leave_track_status' => $row['leave_track_status'],
            'leave_track_status_text' => $status,
            'leave_track_created_by' => $row['leave_track_created_by'],
            'employee_name' => $employeeName,
            'leave_track_created_at' => $row['leave_track_created_at'],
            'leave_track_updated_at' => $row['leave_track_updated_at'],
            'leave_track_submitted_to' => $row['leave_track_submitted_to'],
            'leave_track_approved_rejected_by' => $row['leave_track_approved_rejected_by'],
            'leave_track_approved_rejected_at' => $row['leave_track_approved_rejected_at']
        );
    }

    // Send response
    echo json_encode([
        'status' => 'success',
        'message' => 'Leaves data fetched successfully',
        'data' => $jsonData
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}