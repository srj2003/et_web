<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// Database connection
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['userId']) || !$data['userId']) {
    die(json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]));
}

// Prepare update fields
$updateFields = [];
$params = [];
$types = '';

// Check and add email if provided
if (isset($data['u_email']) && $data['u_email']) {
    $updateFields[] = "u_email = ?";
    $params[] = $data['u_email'];
    $types .= 's';
}

// Check and add mobile if provided
if (isset($data['u_mob']) && $data['u_mob']) {
    $updateFields[] = "u_mob = ?";
    $params[] = $data['u_mob'];
    $types .= 's';
}

// Check and add street address if provided
if (isset($data['u_street_addr']) && $data['u_street_addr']) {
    $updateFields[] = "u_street_addr = ?";
    $params[] = $data['u_street_addr'];
    $types .= 's';
}

// Check and add profile image if provided
if (isset($data['u_pro_img']) && $data['u_pro_img']) {
    $updateFields[] = "u_pro_img = ?";
    $params[] = $data['u_pro_img'];
    $types .= 's';
}

// Add updated_at timestamp
$updateFields[] = "u_updated_at = NOW()";

// Add userId to params array
$params[] = $data['userId'];
$types .= 's';

if (empty($updateFields)) {
    die(json_encode([
        'success' => false,
        'message' => 'No fields to update'
    ]));
}

// Prepare and execute query
$query = "UPDATE user_details SET " . implode(', ', $updateFields) . " WHERE u_id = ?";
$stmt = $conn->prepare($query);

if (!$stmt) {
    die(json_encode([
        'success' => false,
        'message' => 'Query preparation failed: ' . $conn->error
    ]));
}

$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No changes made or user not found'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Update failed: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
