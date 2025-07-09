<?php
// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

    // Authenticate user (token required)
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    // Accept JSON or form POST
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
    if (!$user_id) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing user_id.'
        ]);
        exit;
    }

    // Insert into user_break_logs
    $stmt = $pdo->prepare("INSERT INTO user_break_logs (u_id, break_start_timestamp, break_end_timestamp, created_at, break_duration, break_flag) VALUES (?, NOW(), NULL, CURDATE(), NULL, 1)");
    $stmt->execute([$user_id]);
    $break_id = $pdo->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => 'Break started successfully.',
        'break_id' => $break_id
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}
