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

// Read and decode input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($data['user_id']) || empty($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid user_id"]);
    http_response_code(400);
    exit;
}

$user_id = intval($data['user_id']); // Always sanitize!

// Run query
$sql = "SELECT id, title, message, is_read, created_at 
        FROM user_notification 
        WHERE user_id = $user_id 
        ORDER BY created_at DESC 
        LIMIT 20";

$res = $conn->query($sql);

if (!$res) {
    echo json_encode([
        "status" => "error",
        "message" => "Query failed",
        "details" => $conn->error,
    ]);
    http_response_code(500);
    exit;
}

// Fetch results
$notifications = [];
while ($row = $res->fetch_assoc()) {
    $notifications[] = $row;
}

// Return JSON
echo json_encode([
    "status" => "success",
    "notifications" => $notifications
]);
?>
