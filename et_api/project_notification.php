<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

// Connect to DB
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (empty($input['project_name']) || empty($input['created_by'])) {
    echo json_encode(["success" => false, "error" => "Project name and creator are required"]);
    exit;
}

// Start transaction
$conn->begin_transaction();

try {
    // 1. Insert the new project
    $stmt = $conn->prepare("INSERT INTO projects (project_name, created_by) VALUES (?, ?)");
    $stmt->bind_param("si", $input['project_name'], $input['created_by']);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert project: " . $stmt->error);
    }
    
    $project_id = $stmt->insert_id;
    $stmt->close();
    
    // 2. Create notification for user_id 9
    $notification_title = "New Project Added";
    $notification_message = "Project '{$input['project_name']}' has been created";
    
    $notification_stmt = $conn->prepare("
        INSERT INTO notifications 
        (sender_id, receiver_id, title, message, notification_type, related_id) 
        VALUES (?, 9, ?, ?, 'project', ?)
    ");
    $notification_stmt->bind_param(
        "issi", 
        $input['created_by'],
        $notification_title,
        $notification_message,
        $project_id
    );
    
    if (!$notification_stmt->execute()) {
        throw new Exception("Failed to create notification: " . $notification_stmt->error);
    }
    
    $notification_id = $notification_stmt->insert_id;
    $notification_stmt->close();
    
    // 3. Send push notification to user_id 9
    $push_token_stmt = $conn->prepare("
        SELECT token FROM user_push_tokens WHERE user_id = 9
    ");
    $push_token_stmt->execute();
    $result = $push_token_stmt->get_result();
    $tokens = [];
    
    while ($row = $result->fetch_assoc()) {
        $tokens[] = $row['token'];
    }
    $push_token_stmt->close();
    
    if (!empty($tokens)) {
        // Prepare messages for Expo
        $messages = [];
        foreach ($tokens as $token) {
            $messages[] = [
                'to' => $token,
                'title' => $notification_title,
                'body' => $notification_message,
                'data' => [
                    'notificationId' => $notification_id,
                    'type' => 'project',
                    'relatedId' => $project_id
                ],
                'sound' => 'default'
            ];
        }
        
        // Send to Expo server
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://exp.host/--/api/v2/push/send');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($messages));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("Expo notification error: " . $response);
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "project_id" => $project_id,
        "notification_sent" => !empty($tokens)
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$conn->close();
?>