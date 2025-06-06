<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration
$host = 'geomaticxevs.in';
$dbname = 'geoma7i3_demo_et_dms';
$user = 'geoma7i3_demo_user';
$pass = 'eT@dEm0##25';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

try {
    $jsonInput = file_get_contents("php://input");
    if (!$jsonInput) {
        throw new Exception("No input data received");
    }

    $data = json_decode($jsonInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON format: " . json_last_error_msg());
    }

    $required = ['u_id', 'title', 'message'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    $u_id = filter_var($data['u_id'], FILTER_VALIDATE_INT);
    if ($u_id === false || $u_id < 1) {
        throw new Exception("Invalid user ID");
    }

    $title = trim($data['title']);
    $message = trim($data['message']);
    $sender_id = isset($data['sender_id']) ? intval($data['sender_id']) : null;

    // Prevent self-notification
    if ($sender_id !== null && $u_id == $sender_id) {
        throw new Exception("Cannot send notification to self");
    }

    // Save notification
    $stmt = $pdo->prepare("
        INSERT INTO user_notification 
        (user_id, title, message, created_at)
        VALUES (:user_id, :title, :message, NOW())
    ");
    $stmt->execute([
        ':user_id' => $u_id,
        ':title' => $title,
        ':message' => $message
    ]);

    if ($stmt->rowCount() === 0) {
        throw new Exception("Failed to save notification");
    }

    $notificationId = $pdo->lastInsertId();

    // Fetch Expo token
    $stmt2 = $pdo->prepare("SELECT expo_push_token FROM user_details WHERE u_id = :u_id AND expo_push_token IS NOT NULL AND expo_push_token != '' LIMIT 1");
    $stmt2->execute([':u_id' => $u_id]);
    $row = $stmt2->fetch();
    $expoToken = $row ? $row['expo_push_token'] : null;

    $pushStatus = 'no_token';
    $expoResponse = null;

    if ($expoToken) {
        $expoUrl = 'https://exp.host/--/api/v2/push/send';
        $expoNotification = [
            'to' => $expoToken,
            'sound' => 'default',
            'title' => $title,
            'body' => $message,
            'priority' => 'high'
        ];

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $expoUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($expoNotification));
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $expoResponse = json_decode($response, true);

        if ($httpCode === 200 && isset($expoResponse['data']['status']) && $expoResponse['data']['status'] === 'ok') {
            $pushStatus = 'sent';
        } else {
            $pushStatus = 'failed';
            error_log("Expo push failed for user $u_id: " . $response);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Notification saved and sent (if token exists)',
        'notification_id' => $notificationId,
        'push_status' => $pushStatus,
        'expo_response' => $expoResponse
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
