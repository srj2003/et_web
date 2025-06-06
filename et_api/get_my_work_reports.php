<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit();
}

$user_id = $data['user_id'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Disable emulation

    $query = "
        SELECT wr.*, 
               CONCAT(ud.u_fname, ' ', COALESCE(ud.u_mname, ''), ' ', ud.u_lname) AS user_name
        FROM work_reports wr
        JOIN user_details ud ON wr.user_id = ud.u_id
        WHERE wr.user_id = :user_id
        ORDER BY wr.`date` DESC  /* Added backticks around reserved keyword */
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT); // Explicit parameter binding
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "reports" => $reports]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>