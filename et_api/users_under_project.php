<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["expense_type_id"])) {
    echo json_encode(["status" => "error", "message" => "expense_type_id is required"]);
    exit();
}

$expense_type_id = $data["expense_type_id"];
$userId = isset($data["userId"]) ? $data["userId"] : null;

try {
    $query = "
        SELECT ud.u_id, ud.u_fname, ud.u_mname, ud.u_lname
        FROM project_assignments AS pa
        JOIN user_details AS ud ON pa.u_id = ud.u_id
        WHERE pa.expense_type_id = :expense_type_id
    ";
    if ($userId !== null) {
        $query .= " AND ud.u_id != :userId";
    }
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":expense_type_id", $expense_type_id, PDO::PARAM_INT);
    if ($userId !== null) {
        $stmt->bindParam(":userId", $userId, PDO::PARAM_INT);
    }
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each user, join attendance_details for today
    $today = date('Y-m-d');
    foreach ($users as &$user) {
        $attnQuery = "SELECT is_logged_out FROM attendance_details WHERE user_id = :user_id AND DATE(login_timestamp) = :today LIMIT 1";
        $attnStmt = $pdo->prepare($attnQuery);
        $attnStmt->execute([
            'user_id' => $user['u_id'],
            'today' => $today
        ]);
        $attnRow = $attnStmt->fetch(PDO::FETCH_ASSOC);
        if ($attnRow && isset($attnRow['is_logged_out'])) {
            $user['is_logged_out'] = $attnRow['is_logged_out'];
        } else {
            $user['is_logged_out'] = 1;
        }
    }

    echo json_encode([
        "status" => "success",
        "users" => $users
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Failed to fetch users"]);
}
