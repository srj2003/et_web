<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['userId']) || !isset($input['authToken'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Missing userId or authToken',
        ]);
        exit;
    }
    $userId = $input['userId'];
    $authToken = $input['authToken'];

    $con = new mysqli($servername, $username, $password, $dbname);
    if ($con->connect_error) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $con->connect_error
        ]);
        exit;
    }

    // Check if token exists and expiry_flag is 1
    $stmt = $con->prepare("SELECT expiry_flag FROM tokens WHERE user_id = ? AND token = ? LIMIT 1");
    $stmt->bind_param('is', $userId, $authToken);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Token not found for this user.'
        ]);
        $stmt->close();
        $con->close();
        exit;
    }
    $row = $result->fetch_assoc();
    if ($row['expiry_flag'] == 1) {
        // Update expiry_flag to 0
        $updateStmt = $con->prepare("UPDATE tokens SET expiry_flag = 0 WHERE user_id = ? AND token = ?");
        $updateStmt->bind_param('is', $userId, $authToken);
        $updateStmt->execute();
        $updateStmt->close();
        echo json_encode([
            'status' => 'success',
            'message' => 'Logged out successfully. Token expired.',
            'data' => null
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => 'Token already expired or not active.',
            'data' => null
        ]);
    }
    $stmt->close();
    $con->close();
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request method'
    ]);
}