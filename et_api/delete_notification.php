<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration
$host = 'geomaticxevs.in';
$dbname = 'geoma7i3_demo_et_dms';
$user = 'geoma7i3_demo_user';
$pass = 'eT@dEm0##25';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

try {
    $jsonInput = file_get_contents("php://input");
    if (!$jsonInput) {
        throw new Exception("No input data received");
    }
    $data = json_decode($jsonInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON format: " . json_last_error_msg());
    }

    if (empty($data['notification_id'])) {
        throw new Exception("Missing notification_id");
    }

    $notification_id = filter_var($data['notification_id'], FILTER_VALIDATE_INT);
    if ($notification_id === false || $notification_id < 1) {
        throw new Exception("Invalid notification_id");
    }

    $stmt = $pdo->prepare("DELETE FROM user_notification WHERE id = :id");
    $stmt->execute([':id' => $notification_id]);

    if ($stmt->rowCount() === 0) {
        throw new Exception("Notification not found or already deleted");
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Notification deleted successfully'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage()
    ]);
}
?>