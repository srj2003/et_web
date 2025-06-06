<?php

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

header("Content-Type: application/json");

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: Content-Type");



// Handle preflight request for CORS

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(200);

    exit();

}



// Database config

require_once 'config.php'; // Include your database configuration file



// Connect DB

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {

    http_response_code(500);

    echo json_encode(["message" => "Database connection failed"]);

    exit;

}



// Get user ID from the URL

$requestUri = $_SERVER['REQUEST_URI'];

$segments = explode('/', trim($requestUri, '/'));

$userId = end($segments);



if (!is_numeric($userId)) {

    http_response_code(400);

    echo json_encode(["message" => "Invalid or missing user ID"]);

    exit;

}



// Delete query

//$sql = "DELETE FROM user_details WHERE u_id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $userId);



if ($stmt->execute()) {

    echo json_encode(["message" => "User deleted successfully"]);

} else {

    http_response_code(500);

    echo json_encode(["message" => "Failed to delete user"]);

}



$stmt->close();

$conn->close();

?>

