<?php
header("Content-Type: application/json");
require_once 'db_connection.php'; // Your database connection file

$data = json_decode(file_get_contents('php://input'), true);
$u_id = $data['u_id'] ?? null;

if ($u_id === 13) { // Only allow for u_id = 13
    $stmt = $pdo->prepare("SELECT push_token FROM user_tokens WHERE user_id = ?");
    $stmt->execute([$u_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'push_token' => $result['push_token']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'No push token found for this user'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized access'
    ]);
}
?>