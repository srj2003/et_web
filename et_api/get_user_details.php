<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php'; // Include your database configuration file

if (isset($_GET['action']) && $_GET['action'] === 'get_user_details') {
    $input = json_decode(file_get_contents('php://input'), true);
    $user_id = $input['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(["success" => false, "error" => "user_id is required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT u_fname FROM user_details WHERE user_id = ?");
    if (!$stmt) {
        echo json_encode(["success" => false, "error" => "Failed to prepare statement: " . $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $user_id);

    if ($stmt->execute()) {
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            echo json_encode(["success" => true, "u_fname" => $user['u_fname']]);
        } else {
            echo json_encode(["success" => false, "error" => "User not found."]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Query execution failed: " . $stmt->error]);
    }

    $stmt->close();
    exit;
}
?>