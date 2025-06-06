<?php
// Enable CORS for localhost testing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Accept, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get user ID from the request parameters
if (!isset($_GET['userId']) || empty($_GET['userId'])) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
    exit();
}

$user_id = intval($_GET['userId']); // Ensure it's an integer

// Database connection settings
require_once 'config.php'; // Include your database configuration file

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Prepare SQL query
$sql = "SELECT * FROM expense_track_details WHERE expense_track_created_by = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Initialize response array
$jsonData = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Convert `expense_status` to human-readable text
        $status = match ($row['expense_track_status']) {
            null => "Pending",
            0 => "Rejected",
            1 => "Approved",
            default => "Unknown"
        };

        // Format JSON response
        $jsonData[] = [
            'expense_id' => $row['expense_track_id'],
            'expense_title' => $row['expense_track_title'],
            'expense_type' => $row['expense_type_id'],
            'expense_amount' => $row['expense_total_amount'],
            'expense_status' => $status,
            'expense_date' => $row['expense_track_created_at'],
            'expense_comment' => $row['expense_track_app_rej_remarks'],
        ];
    }
} else {
    $jsonData = ['status' => 'error', 'message' => 'No expense records found'];
}

// Close database connection
$conn->close();

// Send JSON response
echo json_encode($jsonData);
?>