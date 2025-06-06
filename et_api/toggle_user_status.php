<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'config.php'; // DB config

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$response = [
    "success" => false,
    "message" => "Invalid request",
];

try {
    // Read and decode JSON input
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input: " . json_last_error_msg());
    }

    // Log raw input for debugging (you can remove this in production)
    // file_put_contents("debug_input.txt", $rawInput);

    if (!isset($input['user_id']) || !isset($input['u_active'])) {
        throw new Exception("Missing required parameters: user_id or u_active");
    }

    $userId = (int)$input['user_id'];
    $uActive = (int)$input['u_active'];

    if (!is_numeric($userId) || ($uActive !== 0 && $uActive !== 1)) {
        throw new Exception("Invalid values: user_id must be numeric and u_active must be 0 or 1");
    }

    // Update user status (set both u_active and is_logged_out)
    $query = "UPDATE user_details SET u_active = ?, is_logged_out = ? WHERE u_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iii", $uActive, $isLoggedOut, $userId);

    // Set is_logged_out: 0 = active, 1 = deactivated
    $isLoggedOut = $uActive === 1 ? 0 : 1;

    if ($stmt->execute()) {
        $response["success"] = true;
        $response["message"] = $uActive === 1 ? "User activated successfully." : "User deactivated successfully.";
    } else {
        throw new Exception("Failed to execute SQL statement.");
    }

    $stmt->close();
} catch (Exception $e) {
    $response["message"] = "Error updating user status: " . $e->getMessage();
}

$conn->close();
echo json_encode($response);
