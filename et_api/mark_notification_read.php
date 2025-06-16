<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}


$data = json_decode(file_get_contents("php://input"), true);
$notification_id = $data['notification_id'];

$stmt = $conn->prepare("UPDATE user_notification SET is_read = 1 WHERE id = ?");
$stmt->bind_param("i", $notification_id);
$stmt->execute();

echo json_encode(["success" => true]);
?>
