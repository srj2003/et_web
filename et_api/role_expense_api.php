<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "config.php";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => "Database connection failed: " . $conn->connect_error
    ]));
}

$data = json_decode(file_get_contents("php://input"), true);

// GET - Fetch role details (role_id required)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['role_id'])) {
        $role_id = intval($_GET['role_id']);
        $query = "SELECT role_id, role_name, role_parent, role_active, total_expense_amount FROM user_role WHERE role_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $role_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            echo json_encode([
                'success' => true,
                'data' => $result->fetch_assoc()
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => "Role not found"
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => "role_id is required in the request"
        ]);
    }
    exit();
}

// POST/PUT - Create or Update role (including expense amount)
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($data['role_id'])) {
        echo json_encode([
            'success' => false,
            'message' => "Role ID is required"
        ]);
        exit();
    }

    $role_id = intval($data['role_id']);
    $role_name = isset($data['role_name']) ? trim($data['role_name']) : null;
    $role_parent = isset($data['role_parent']) ? intval($data['role_parent']) : null;
    $role_active = isset($data['role_active']) ? intval($data['role_active']) : null;
    // Use array_key_exists to allow 0 as a valid value
    $total_expense_amount = array_key_exists('total_expense_amount', $data) ? floatval($data['total_expense_amount']) : null;

    // Validate expense amount if provided
    if ($total_expense_amount !== null && ($total_expense_amount < 0 || $total_expense_amount > 100000)) {
        echo json_encode([
            'success' => false,
            'message' => "Amount must be between 0 and 100,000"
        ]);
        exit();
    }

    // Check if role exists
    $checkQuery = "SELECT role_id FROM user_role WHERE role_id = ?";
    $stmtCheck = $conn->prepare($checkQuery);
    $stmtCheck->bind_param("i", $role_id);
    $stmtCheck->execute();
    $roleExists = $stmtCheck->get_result()->num_rows > 0;

    if ($roleExists) {
        // Update existing role
        $updateFields = [];
        $params = [];
        $types = '';
        
        if ($role_name !== null) {
            $updateFields[] = "role_name = ?";
            $params[] = $role_name;
            $types .= 's';
        }
        
        if ($role_parent !== null) {
            $updateFields[] = "role_parent = ?";
            $params[] = $role_parent;
            $types .= 'i';
        }
        
        if ($role_active !== null) {
            $updateFields[] = "role_active = ?";
            $params[] = $role_active;
            $types .= 'i';
        }
        
        // Use array_key_exists to allow 0 as a valid value
        if (array_key_exists('total_expense_amount', $data)) {
            $updateFields[] = "total_expense_amount = ?";
            $params[] = $total_expense_amount;
            $types .= 'd';
        }
        
        if (empty($updateFields)) {
            echo json_encode([
                'success' => false,
                'message' => "No fields to update"
            ]);
            exit();
        }
        
        $params[] = $role_id;
        $types .= 'i';
        
        $query = "UPDATE user_role SET " . implode(", ", $updateFields) . " WHERE role_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            // Fetch the updated row
            $fetch = $conn->prepare("SELECT role_id, role_name, role_parent, role_active, total_expense_amount FROM user_role WHERE role_id = ?");
            $fetch->bind_param("i", $role_id);
            $fetch->execute();
            $result = $fetch->get_result();
            $updated = $result->fetch_assoc();
            echo json_encode([
                'success' => true,
                'message' => "Role updated successfully",
                'changes' => [
                    'role_name' => $role_name,
                    'role_parent' => $role_parent,
                    'role_active' => $role_active,
                    'total_expense_amount' => $total_expense_amount
                ],
                'updated' => $updated
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => "Error updating role: " . $stmt->error
            ]);
        }
    } else {
        // Create new role - require all mandatory fields
        if (!isset($data['role_name'], $data['role_parent'])) {
            echo json_encode([
                'success' => false,
                'message' => "New roles require role_name and role_parent"
            ]);
            exit();
        }
        
        $query = "INSERT INTO user_role (role_id, role_name, role_parent, role_active, total_expense_amount) 
                 VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $role_active = $role_active ?? 1; // Default to active
        $total_expense_amount = $total_expense_amount ?? 0.00; // Default to 0
        
        $stmt->bind_param("isiid", $role_id, $role_name, $role_parent, $role_active, $total_expense_amount);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => "New role created successfully"
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => "Error creating role: " . $stmt->error
            ]);
        }
    }
    exit();
}

// DELETE - Deactivate role (set role_active to 0)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($data['role_id'])) {
        echo json_encode([
            'success' => false,
            'message' => "Role ID is required"
        ]);
        exit();
    }

    $role_id = intval($data['role_id']);
    
    $query = "UPDATE user_role SET role_active = 0 WHERE role_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $role_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => "Role deactivated successfully"
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => "Error deactivating role: " . $stmt->error
        ]);
    }
    exit();
}

echo json_encode([
    'success' => false,
    'message' => "Invalid request method or missing role_id"
]);
$conn->close();
?>