<?php
require 'config.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['fcm_token'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
    exit;
}

$user_id = $data['user_id'];
$fcm_token = $data['fcm_token'];

$pdo = new PDO('mysql:host=localhost;dbname=et_app', 'root', '');
$stmt = $pdo->prepare("REPLACE INTO fcm_token (user_id, token) VALUES (?, ?)");
if ($stmt->execute([$user_id, $fcm_token])) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'DB error']);
}
?>