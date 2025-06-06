<?php
// File: /home3/geoma7i3/demo-expense.geomaticxevs.in/ET-api/send_fcm_notification.php

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Enable error reporting for debugging (remove on production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set response content-type
header('Content-Type: application/json');

// Load composer autoload (make sure vendor folder is here!)
require_once __DIR__ . '../vendor/autoload.php';
  // <-- Changed here to absolute path
require_once __DIR__ . '/config.php';            // Your config file path

use Firebase\JWT\JWT;
use GuzzleHttp\Client;

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);
$title = $data['title'] ?? '';
$message = $data['message'] ?? '';
$sender_id = $data['sender_id'] ?? null;

// Validate input
if (!$title || !$message || !$sender_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing title, message or sender_id']);
    exit;
}

// Load Firebase service account JSON
$serviceAccountPath = __DIR__ . '/geomaticxet-firebase-adminsdk-fbsvc-37fba87390.json';
if (!file_exists($serviceAccountPath)) {
    echo json_encode(['status' => 'error', 'message' => 'Service account JSON file not found']);
    exit;
}

$serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);

// Prepare JWT payload for Google OAuth token
$now = time();
$jwtPayload = [
    "iss" => $serviceAccount['client_email'],
    "sub" => $serviceAccount['client_email'],
    "aud" => "https://oauth2.googleapis.com/token",
    "iat" => $now,
    "exp" => $now + 3600,
    "scope" => "https://www.googleapis.com/auth/firebase.messaging"
];

// Generate JWT signed with your private key
$jwt = JWT::encode($jwtPayload, $serviceAccount['private_key'], 'RS256');

// Get OAuth access token from Google
$client = new Client();

try {
    $response = $client->post("https://oauth2.googleapis.com/token", [
        'form_params' => [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to get access token', 'error' => $e->getMessage()]);
    exit;
}

$accessToken = json_decode($response->getBody(), true)['access_token'] ?? null;

if (!$accessToken) {
    echo json_encode(['status' => 'error', 'message' => 'Access token not received']);
    exit;
}

// Connect to your database
try {
    $pdo = new PDO('mysql:host=localhost;dbname=et_app', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed', 'error' => $e->getMessage()]);
    exit;
}

// Fetch all user tokens that are not null or empty
$stmt = $pdo->query("SELECT user_id, token FROM fcm_token WHERE token IS NOT NULL AND token != ''");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$projectId = $serviceAccount['project_id'];
$fcmUrl = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

// Send notification to each user token
foreach ($users as $user) {
    $fcmMessage = [
        "message" => [
            "token" => $user['token'],
            "notification" => [
                "title" => $title,
                "body" => $message
            ]
        ]
    ];

    try {
        $client->post($fcmUrl, [
            'headers' => [
                'Authorization' => "Bearer {$accessToken}",
                'Content-Type'  => 'application/json'
            ],
            'json' => $fcmMessage
        ]);
    } catch (Exception $e) {
        // Log the error if needed but continue sending to others
        // error_log("FCM send error for user {$user['user_id']}: " . $e->getMessage());
    }

    // Save notification record in your DB
    $stmt2 = $pdo->prepare("INSERT INTO notifications (sender_id, recipient_id, recipient_role, title, message, notification_type) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt2->execute([$sender_id, $user['user_id'], 'user', $title, $message, 'admin_broadcast']);
}

// Respond success
echo json_encode(['status' => 'success', 'message' => 'Notification sent to all users']);
