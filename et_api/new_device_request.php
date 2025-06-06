<?php
// Include the database configuration
require_once 'config.php';

// Set Content-Type to JSON
header('Content-Type: application/json');

// Connect to the MySQL database
$conn = new mysqli($servername, $username, $password, $dbname);

// Check for a successful connection
if ($conn->connect_error) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// If a POST request is received with 'action' = 'accept', update the table
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'accept') {
    $update_sql = "UPDATE user_details SET new_device_request = 0 WHERE new_device_request = 1";

    if (!$conn->query($update_sql)) {
        http_response_code(500);
        echo json_encode(["error" => "Update failed: " . $conn->error]);
        $conn->close();
        exit;
    }
}

// Fetch u_id and new_device_request for all users
$select_sql = "SELECT u_id, new_device_request FROM user_details";
$result = $conn->query($select_sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Fetch failed: " . $conn->error]);
    $conn->close();
    exit;
}

// Store results in an array
$response = [];
while ($row = $result->fetch_assoc()) {
    $response[] = $row;
}

// Output the result as JSON
echo json_encode($response);

// Close the database connection
$conn->close();
?>
