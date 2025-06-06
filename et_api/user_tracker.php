<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'error' => 'Connection failed: ' . $conn->connect_error
    ]));
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (
    !isset($data['u_id']) || !isset($data['attn_id']) ||
    !isset($data['lat']) || !isset($data['long']) ||
    !isset($data['timestamp'])
) {
    echo json_encode([
        'success' => false,
        'error' => 'Missing required fields'
    ]);
    exit();
}

// Sanitize inputs
$u_id = intval($data['u_id']);
$attn_id = intval($data['attn_id']);
$lat = floatval($data['lat']);
$long = floatval($data['long']);
$timestamp = $conn->real_escape_string($data['timestamp']);

// Insert query
$sql = "INSERT INTO track_user_details (u_id, attn_id, lat, `long`, `timestamp`) 
        VALUES (?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iidds", $u_id, $attn_id, $lat, $long, $timestamp);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'track_id' => $conn->insert_id,
        'message' => 'Location tracked successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Error tracking location: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
