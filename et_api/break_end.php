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
    $break_duration = isset($input['break_duration']) ? $input['break_duration'] : null;
    if (!$user_id || $break_duration === null) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing user_id or break_duration.'
        ]);
        exit;
    }

    // Update the break log for this user for today where break_flag is 1
    $stmt = $pdo->prepare("UPDATE user_break_logs SET break_end_timestamp = NOW(), break_duration = ?, break_flag = 0 WHERE u_id = ? AND created_at = CURDATE() AND break_flag = 1");
    $stmt->execute([$break_duration, $user_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Break ended successfully.'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'No active break found for this user today.'
        ]);
    }
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}
