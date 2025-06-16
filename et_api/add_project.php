<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$project_name = $data['project_name'];
$created_by = $data['created_by']; // Name (for display)
$created_by_id = $data['created_by_id']; // User ID (for assigned_by)
$assigned_employees = $data['assigned_employees']; // [{u_id, role}, ...]

$conn->begin_transaction();

try {
    // Insert into expense_types (acts as project)
    $stmt = $conn->prepare("INSERT INTO expense_types (expense_type_name, created_by) VALUES (?, ?)");
    $stmt->bind_param("ss", $project_name, $created_by);
    $stmt->execute();
    $expense_type_id = $conn->insert_id;
    $stmt->close();

    // Insert assignments
    foreach ($assigned_employees as $emp) {
        $u_id = $emp['u_id'];
        $role_name = $emp['role'];

        // Get or create role_id
        $role_stmt = $conn->prepare("SELECT role_id FROM project_roles WHERE role_name=?");
        $role_stmt->bind_param("s", $role_name);
        $role_stmt->execute();
        $role_stmt->bind_result($role_id);
        if (!$role_stmt->fetch()) {
            $role_stmt->close();
            $role_stmt = $conn->prepare("INSERT INTO project_roles (role_name) VALUES (?)");
            $role_stmt->bind_param("s", $role_name);
            $role_stmt->execute();
            $role_id = $conn->insert_id;
        }
        $role_stmt->close();

        // Assign employee (use expense_type_id and created_by_id)
        $assign_stmt = $conn->prepare("INSERT INTO project_assignments (expense_type_id, u_id, role_id, assigned_by) VALUES (?, ?, ?, ?)");
        $assign_stmt->bind_param("iiii", $expense_type_id, $u_id, $role_id, $created_by_id);
        $assign_stmt->execute();
        $assign_stmt->close();
    }

    $conn->commit();
    echo json_encode(['success'=>true, 'message'=>'Project and assignments added']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success'=>false, 'message'=>'Error: '.$e->getMessage()]);
}
?>