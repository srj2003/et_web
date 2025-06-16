<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php'; // Should set up $pdo (PDO connection)

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $title = $data['title'] ?? "New Expense Added";
    $message = $data['message'] ?? "A user has submitted a new expense.";

    // Get Admin user (role_id = 1)
    $stmt = $pdo->prepare("SELECT user_id, expo_push_token FROM user_details WHERE role_id = 1 LIMIT 1");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        // Save notification in user_notification table
        $insert = $pdo->prepare("INSERT INTO user_notification (user_id, title, message, created_at) VALUES (?, ?, ?, NOW())");
        $insert->execute([$admin['user_id'], $title, $message]);

        // Optionally send Expo push notification if token exists
        if (!empty($admin['expo_push_token'])) {
            sendPushNotification($admin['expo_push_token'], $title, $message);
        }

        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Admin not found"]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

function sendPushNotification($token, $title, $message) {
    $payload = json_encode([
        "to" => $token,
        "sound" => "default",
        "title" => $title,
        "body" => $message,
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://exp.host/--/api/v2/push/send");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Accept: application/json",
        "Content-Type: application/json",
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_exec($ch);
    curl_close($ch);
}