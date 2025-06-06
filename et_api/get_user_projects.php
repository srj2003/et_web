<?php
header("Access-Control-Allow-Origin: *");
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["user_id"])) {
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit();
}

$user_id = $data["user_id"];

try {
    $stmt = $pdo->prepare("
        SELECT 
        et.expense_type_id AS project_id,
        et.expense_type_name AS project_name,
        CASE 
            WHEN et.expense_type_is_active = 1 THEN 'Ongoing'
            ELSE 'Complete'
        END AS status
    FROM expense_types AS et
    JOIN project_assignments AS pa ON et.expense_type_id = pa.expense_type_id
    WHERE pa.u_id = :user_id 
    ORDER BY et.expense_type_created_at DESC 
  ");
    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "projects" => $projects
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Failed to fetch projects"]);
}
?>