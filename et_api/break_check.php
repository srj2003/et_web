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
    if (!$user_id) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing user_id.'
        ]);
        exit;
    }

    // Fetch the latest break log for today with break_flag = 1
    $stmt = $pdo->prepare("SELECT * FROM user_break_logs WHERE u_id = ? AND created_at = CURDATE() AND break_flag = 1 ORDER BY break_start_timestamp DESC LIMIT 1");
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $user_on_break = $row ? true : false;

    echo json_encode([
        'status' => 'success',
        'user_on_break' => $user_on_break
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}
