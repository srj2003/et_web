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
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    // Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $authenticated_user_id = $auth['user_id'];

    // Get the JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    $requested_user_id = isset($data['user_id']) ? $data['user_id'] : $authenticated_user_id;

    // Verify that the authenticated user matches the requested user_id
    if ($authenticated_user_id != $requested_user_id) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Unauthorized access'
        ]);
        exit;
    }

    $query = "
        SELECT wr.*, 
               TRIM(CONCAT(ud.u_fname, ' ', COALESCE(ud.u_mname, ''), ' ', ud.u_lname)) AS user_name,
               ur.role_name,
               DATE_FORMAT(wr.created_at, '%h:%i %p') as submission_time
        FROM work_reports wr
        JOIN user_details ud ON wr.user_id = ud.u_id
        LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
        LEFT JOIN user_role ur ON ar.role_id = ur.role_id
        WHERE wr.user_id = :user_id
        ORDER BY wr.`date` DESC, wr.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $authenticated_user_id, PDO::PARAM_INT);
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Work reports fetched successfully',
        'reports' => $reports
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}