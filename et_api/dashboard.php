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

    // ?? Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $user_id = $auth['user_id'];

    // Fetch user basic details
    $stmt = $pdo->prepare("
        SELECT 
            u.u_id, u.u_fname, u.u_mname, u.u_lname, u.u_email, u.u_mob,
            u.u_city, u.u_state, u.u_country, u.u_zip_code, u.u_street_addr,
            u.u_pro_img,
            (SELECT COUNT(*) FROM attendance_details 
             WHERE user_id = u.u_id AND is_logged_out = 0 AND DATE(login_timestamp) < CURDATE()) 
             AS not_logged_out_count
        FROM user_details u
        WHERE u.u_id = ?
    ");
    $stmt->execute([$user_id]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found'
        ]);
        exit;
    }

    // Send response
    echo json_encode([
        'status' => 'success',
        'message' => 'Dashboard data fetched successfully',
        'data' => $userData
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}
