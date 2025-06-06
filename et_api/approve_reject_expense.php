<?php
// Enable CORS for localhost testing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection settings
require_once 'config.php';

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Get the JSON payload from the request
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['expense_track_id']) || !isset($input['action']) || !isset($input['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
    exit();
}

$expense_track_id = $input['expense_track_id'];
$action = $input['action']; // "approve" or "reject"
$user_id = $input['user_id']; // User ID from AsyncStorage

// Determine the new status based on the action
$new_status = null;
if ($action === 'approve') {
    $new_status = 1; // Approved
} elseif ($action === 'reject') {
    $new_status = 0; // Rejected
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit();
}

// Get the current timestamp
$current_timestamp = date('Y-m-d H:i:s');

// Update the expense request in the database
$sql = "
    UPDATE expense_track_details
    SET 
        expense_track_status = ?, 
        expense_track_approved_rejected_by = ?, 
        expense_track_approved_rejected_at = ?
    WHERE 
        expense_track_id = ? AND expense_track_status IS NULL
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement: ' . $conn->error]);
    exit();
}

$stmt->bind_param('iisi', $new_status, $user_id, $current_timestamp, $expense_track_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Expense request updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No expense request found or already processed']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update expense request: ' . $stmt->error]);
}

// Close the statement and connection
$stmt->close();
$conn->close();