<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "config.php"; // Your database configuration file

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => "Database connection failed: " . $conn->connect_error
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['role_id'])) {
    echo json_encode([
        'success' => false,
        'message' => "role_id is required in the request body"
    ]);
    exit();
}

$role_id = (int)$input['role_id'];

// Prepare and execute query
$stmt = $conn->prepare("
    SELECT 
        role_id, 
        role_name, 
        role_parent, 
        role_active, 
        total_expense_amount,
        created_at, 
        updated_at
    FROM user_role 
    WHERE role_id = ?
");
$stmt->bind_param("i", $role_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => "No role found with ID: $role_id"
    ]);
    exit();
}

// Fetch the role data
$role = $result->fetch_assoc();

// Get parent role name if exists
$parent_name = null;
if ($role['role_parent']) {
    $parent_stmt = $conn->prepare("SELECT role_name FROM user_role WHERE role_id = ?");
    $parent_stmt->bind_param("i", $role['role_parent']);
    $parent_stmt->execute();
    $parent_result = $parent_stmt->get_result();
    if ($parent_result->num_rows > 0) {
        $parent_name = $parent_result->fetch_assoc()['role_name'];
    }
    $parent_stmt->close();
}

// Format the response
$response = [
    'success' => true,
    'data' => [
        'role_id' => (int)$role['role_id'],
        'role_name' => $role['role_name'],
        'role_parent' => $role['role_parent'] ? (int)$role['role_parent'] : null,
        'parent_role_name' => $parent_name,
        'role_active' => (bool)$role['role_active'],
        'total_expense_amount' => (float)$role['total_expense_amount'],
        'created_at' => $role['created_at'],
        'updated_at' => $role['updated_at'],
        'status' => $role['role_active'] ? 'Active' : 'Inactive'
    ]
];

echo json_encode($response);

$conn->close();
?>