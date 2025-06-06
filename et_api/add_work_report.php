<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once 'config.php'; // Include your database configuration file


try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Get the JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["user_id"], $data["date"], $data["project_name"], $data["work_details"])) {
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit();
}

$user_id = $data["user_id"];
$date = $data["date"];
$project_name = $data["project_name"];
$work_details = $data["work_details"];

try {
    $stmt = $pdo->prepare("INSERT INTO work_reports (user_id, date, project_name, work_details) VALUES (:user_id, :date, :project_name, :work_details)");
    $stmt->execute([
        ":user_id" => $user_id,
        ":date" => $date,
        ":project_name" => $project_name,
        ":work_details" => $work_details,
    ]);

    echo json_encode(["status" => "success", "message" => "Work report added successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Failed to add work report"]);
}
?>