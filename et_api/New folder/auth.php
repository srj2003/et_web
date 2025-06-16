<?php
function verifyTokenPDO($pdo)
{
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

    if (!$token) {
        return ['status' => false, 'message' => 'No token provided'];
    }

    try {
        $stmt = $pdo->prepare("SELECT u_id FROM user_tokens WHERE token = ? AND token_expiry > NOW()");
        $stmt->execute([$token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return ['status' => false, 'message' => 'Invalid or expired token'];
        }

        return ['status' => true, 'user_id' => $result['u_id']];
    } catch (Exception $e) {
        return ['status' => false, 'message' => 'Token verification failed'];
    }
}