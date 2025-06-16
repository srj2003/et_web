<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include config and token verifier
require_once 'config.php';
require_once 'auth.php';

try {
    // PDO connection
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $authenticated_user_id = $auth['user_id'];
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    if ($method === 'GET') {
        if ($action === 'get_user_details') {
            $input = json_decode(file_get_contents("php://input"), true);
            $user_id = $input['user_id'] ?? null;

            if (!$user_id) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Missing user_id"
                ]);
                exit;
            }

            $stmt = $pdo->prepare("SELECT u_fname FROM user_details WHERE u_id = ?");
            $stmt->execute([$user_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                echo json_encode([
                    "status" => "success",
                    "data" => $result
                ]);
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "User not found"
                ]);
            }
        } else {
            $stmt = $pdo->prepare("SELECT * FROM expense_types");
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "data" => $data
            ]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $name = $input['expense_type_name'] ?? '';
        $created_by = $authenticated_user_id; // Use authenticated user ID

        if (empty($name)) {
            echo json_encode([
                "status" => "error",
                "message" => "expense_type_name is required"
            ]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO expense_types (expense_type_name, created_by) VALUES (?, ?)");
        $stmt->execute([$name, $created_by]);

        echo json_encode([
            "status" => "success",
            "message" => "Expense type created successfully",
            "id" => $pdo->lastInsertId()
        ]);
    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['expense_type_id'] ?? null;
        $name = $input['expense_type_name'] ?? null;
        $is_active = $input['expense_type_is_active'] ?? null;

        if (empty($id)) {
            echo json_encode([
                "status" => "error",
                "message" => "expense_type_id is required"
            ]);
            exit;
        }

        if ($is_active !== null) {
            $stmt = $pdo->prepare("UPDATE expense_types SET expense_type_is_active = ? WHERE expense_type_id = ?");
            $stmt->execute([$is_active, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE expense_types SET expense_type_name = ? WHERE expense_type_id = ?");
            $stmt->execute([$name, $id]);
        }

        echo json_encode([
            "status" => "success",
            "message" => "Expense type updated successfully"
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}
