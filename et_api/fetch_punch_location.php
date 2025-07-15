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

    // Get user_id, startDate, endDate from POST body
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $startDate = $input['startDate'] ?? null;
    $endDate = $input['endDate'] ?? null;

    if (!$userId || !$startDate || !$endDate) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing user_id, startDate, or endDate in request.'
        ]);
        exit;
    }

    // Query attendance_details for the user and date range
    $query = "SELECT * FROM attendance_details WHERE user_id = :user_id AND login_timestamp >= :startDate AND login_timestamp <= :endDate ORDER BY login_timestamp DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'user_id' => $userId,
        'startDate' => $startDate,
        'endDate' => $endDate
    ]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $results
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
    exit;
}
