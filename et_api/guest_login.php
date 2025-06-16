<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Database connection
require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

$u_id = isset($data['u_id']) ? $conn->real_escape_string($data['u_id']) : '';
$device_id = isset($data['device_id']) ? $conn->real_escape_string($data['device_id']) : '';

if (!$u_id || !$device_id) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

// Try to find the user in the user_details table
$sql = "SELECT device_detail FROM user_details WHERE u_id = '$u_id' LIMIT 1";
$result = $conn->query($sql);

if ($result === false) {
    echo json_encode(["success" => false, "message" => "Database query failed"]);
    exit;
}

if ($result->num_rows > 0) {
    // User exists, validate device
    $row = $result->fetch_assoc();
    $stored_device_id = $row['device_detail'];

    if ($stored_device_id === NULL || $stored_device_id === '') {
        // First time setting device
        $update = "UPDATE user_details SET device_detail = '$device_id' WHERE u_id = '$u_id'";
        if ($conn->query($update)) {
            echo json_encode(["success" => true, "message" => "Device registered successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to register device"]);
        }
    } elseif ($stored_device_id === $device_id) {
        // Device matches
        echo json_encode(["success" => true, "message" => "Device match"]);
    } else {
        // Device mismatch
        echo json_encode(["success" => false, "message" => "Device mismatch"]);
    }
} else {
    // No such user
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$conn->close();
?>