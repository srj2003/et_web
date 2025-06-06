<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "CORS preflight"]);
    exit();
}

require_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['u_id'] ?? null;
$role_id = $data['role_id'] ?? null;

if (!$user_id || !$role_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing u_id or role_id"]);
    exit;
}

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Update the user's role in user_role table
$stmt = $conn->prepare("UPDATE user_role SET role_id = ? WHERE u_id = ?");
$stmt->bind_param("is", $role_id, $user_id);

if ($stmt->execute()) {
    // Even if no rows updated, return success for UI consistency
    echo json_encode(["success" => true, "message" => "User role updated successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to update user role"]);
}

$stmt->close();
$conn->close();
?>
