<?php
function verifyTokenPDO($pdo) {
    $headers = getallheaders();

    if (!isset($headers['Authorization'])) {
        return ['status' => false, 'message' => 'Missing Authorization header'];
    }

    if (!preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        return ['status' => false, 'message' => 'Invalid Authorization format'];
    }

    $token = $matches[1];

    $stmt = $pdo->prepare("SELECT user_id FROM tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return ['status' => true, 'user_id' => $row['user_id']];
    } else {
        return ['status' => false, 'message' => 'Invalid or expired token'];
    }
}
