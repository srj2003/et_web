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
require_once 'config.php'; // Include your database configuration file

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
if (!isset($input['requisition_id']) || !isset($input['action']) || !isset($input['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
    exit();
}

// Add approved_amount validation for approve/partial actions
if (($input['action'] === 'approve' || $input['status'] === 2) && !isset($input['approved_amount'])) {
    echo json_encode(['status' => 'error', 'message' => 'Approved amount is required']);
    exit();
}

$requisition_id = $input['requisition_id'];
$action = $input['action']; // "approve" or "reject"
$user_id = $input['user_id']; // User ID from AsyncStorage

// Determine the new status based on the action
$new_status = null;
if ($action === 'approve') {
    $new_status = isset($input['status']) ? $input['status'] : 1; // Use status if provided, default to 1
} elseif ($action === 'reject') {
    $new_status = 0; // Rejected
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit();
}

$approved_amount = isset($input['approved_amount']) ? $input['approved_amount'] : 0;

// Update the requisition in the database
$sql = "
    UPDATE expense_requisition_details
    SET 
        requisition_status = ?, 
        requisition_approved_rejected_by = ?,
        requisition_app_amount = ?,
        requisition_updated_at = CURRENT_TIMESTAMP
    WHERE requisition_id = ? AND requisition_status IS NULL
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement: ' . $conn->error]);
    exit();
}

$stmt->bind_param('iidd', $new_status, $user_id, $approved_amount, $requisition_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Requisition updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No requisition found or already processed']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update requisition: ' . $stmt->error]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
