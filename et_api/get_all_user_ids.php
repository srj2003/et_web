<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
ob_start();

header("Access-Control-Allow-Origin: *");  // Or specific origin
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Accept, Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed",
        "error" => $conn->connect_error
    ]);
    exit;
}

$user_ids = [];
$sql = "SELECT u_id FROM user_details WHERE expo_push_token IS NOT NULL AND u_active = 1";

if ($stmt = $conn->prepare($sql)) {
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $user_ids[] = (int)$row['u_id'];
        }
        echo json_encode([
            "success" => true,
            "user_ids" => $user_ids
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Query failed",
            "error" => $conn->error
        ]);
    }
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Query preparation failed",
        "error" => $conn->error
    ]);
}

$conn->close();
ob_end_flush();
?>