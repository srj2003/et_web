<?php
require 'config.php'; // Include your database configuration

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'];
    $expoPushToken = $data['fcm_tokens'];

    if (!$userId || !$expoPushToken) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
        exit;
    }

    $stmt = $con->prepare("UPDATE fcm_tokens SET token = ? WHERE user_id = ?");
    $stmt->bind_param("si", $expoPushToken, $userId);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Push token saved']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to save push token']);
    }

    $stmt->close();
    $con->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>