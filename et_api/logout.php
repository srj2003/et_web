<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $session_id = $headers['Session-Id'] ?? null;
    $user_id = $headers['User-Id'] ?? null;

    if ($session_id && $user_id) {
        // Remove session from database
        $conn = new mysqli($servername, $username, $password, $dbname);
        $query = "DELETE FROM user_sessions WHERE session_id = ? AND user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('si', $session_id, $user_id);
        $stmt->execute();
    }

    // Clear session
    session_unset();
    session_destroy();

    echo json_encode([
        'status' => 'success',
        'message' => 'Logged out successfully'
    ]);
}