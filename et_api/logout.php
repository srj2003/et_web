<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['userid'] ?? null;

    // Clear session
    session_unset();
    session_destroy();

    echo json_encode([
        'status' => 'success',
        'message' => 'Logged out successfully',
        'data' => [
            'user_id' => $user_id
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request method'
    ]);
}