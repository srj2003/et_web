<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'config.php';

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
    $conn->begin_transaction();
    
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input: " . json_last_error_msg());
    }

    if (!isset($input['user_id']) || !isset($input['u_active'])) {
        throw new Exception("Missing required parameters: user_id or u_active");
    }

    $userId = (int)$input['user_id'];
    $uActive = (int)$input['u_active'];

    if (!is_numeric($userId) || ($uActive !== 0 && $uActive !== 1)) {
        throw new Exception("Invalid values: user_id must be numeric and u_active must be 0 or 1");
    }

    // First get user details for notification
    $userQuery = "SELECT u_email, expo_push_token FROM user_details WHERE u_id = ?";
    $userStmt = $conn->prepare($userQuery);
    $userStmt->bind_param("i", $userId);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();

    // Update user status using only u_active
    $query = "UPDATE user_details SET u_active = ? WHERE u_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $uActive, $userId);

    if ($stmt->execute()) {
        // Send email notification
        $emailSubject = $uActive === 1 ? "Account Activated" : "Account Deactivated";
        $emailBody = $uActive === 1 
            ? "Your account has been activated. You can now log in to the system."
            : "Your account has been deactivated. Please contact the administrator for more information.";

        mail($userData['u_email'], $emailSubject, $emailBody);

        $response["success"] = true;
        $response["message"] = $uActive === 1 ? "User activated successfully." : "User deactivated successfully.";
    } else {
        throw new Exception("Failed to execute SQL statement.");
    }

    $stmt->close();
    $conn->commit();
    
} catch (Exception $e) {
    $conn->rollback();
    $response["message"] = "Error updating user status: " . $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response);
?>