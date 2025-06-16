<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

// Read and decode JSON input
$input = json_decode(file_get_contents("php://input"), true);

if (
    !isset($input['title']) ||
    !isset($input['message']) ||
    !isset($input['user_ids']) ||
    !is_array($input['user_ids']) ||
    !isset($input['sender_id'])  // Make sender_id required
) {
    echo json_encode(["success" => false, "message" => "Missing or invalid parameters"]);
    exit;
}

$title = $input['title'];
$message = $input['message'];
$user_ids = $input['user_ids'];
$sender_id = $input['sender_id'];

// Remove sender_id from the user_ids array and reindex
$user_ids = array_values(array_filter($user_ids, function($id) use ($sender_id) {
    return $id != $sender_id;
}));

// If no users left after filtering
if (empty($user_ids)) {
    echo json_encode(["success" => false, "message" => "No valid recipients found"]);
    exit;
}

// Fetch Expo push tokens for the given user IDs (excluding admin)
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$placeholders = implode(',', array_fill(0, count($user_ids), '?'));
$stmt = $conn->prepare("SELECT u_id, expo_push_token FROM user_details WHERE u_id IN ($placeholders) AND expo_push_token IS NOT NULL AND expo_push_token != ''");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Query preparation failed"]);
    exit;
}

$stmt->bind_param(str_repeat('i', count($user_ids)), ...$user_ids);
$stmt->execute();
$result = $stmt->get_result();

$tokens = [];
$userIdMap = [];
while ($row = $result->fetch_assoc()) {
    if (!empty($row['expo_push_token'])) {
        $tokens[] = $row['expo_push_token'];
        $userIdMap[$row['expo_push_token']] = $row['u_id'];
    }
}

// Function to send push notification via Expo
function sendPushNotification($token, $title, $message) {
    $payload = json_encode([
        'to' => $token,
        'sound' => 'default',
        'title' => $title,
        'body' => $message,
        'priority' => 'high'
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://exp.host/--/api/v2/push/send');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

$successCount = 0;
$failureCount = 0;

// Send notification and log to DB only for users with valid tokens
foreach ($tokens as $token) {
    $user_id = $userIdMap[$token];
    
    // Save notification to DB
    $stmt2 = $conn->prepare("INSERT INTO user_notification (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)");
    $stmt2->bind_param("iss", $user_id, $title, $message);
    $stmt2->execute();

    // Send push notification
    $response = sendPushNotification($token, $title, $message);
    $responseData = json_decode($response, true);
    
    if (isset($responseData['data']) && !isset($responseData['errors'])) {
        $successCount++;
    } else {
        $failureCount++;
    }
}

echo json_encode([
    "success" => true,
    "message" => "Notifications processed: $successCount successful, $failureCount failed",
    "details" => [
        "success_count" => $successCount,
        "failure_count" => $failureCount,
        "total_users" => count($tokens)
    ]
]);

$conn->close();
?>