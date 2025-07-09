<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "config.php";

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
if (!isset($input['u_id']) || !isset($input['total_expense_amount'])) {
    echo json_encode([
        'success' => false,
        'message' => "Both u_id and total_expense_amount are required"
    ]);
    exit();
}

$u_id = (int)$input['u_id'];
$total_expense_amount = (float)$input['total_expense_amount'];
$updated_at = date('Y-m-d H:i:s');

// Validate amount range
if ($total_expense_amount < 0 || $total_expense_amount > 100000) {
    echo json_encode([
        'success' => false,
        'message' => "Amount must be between 0 and 100,000"
    ]);
    exit();
}

try {
    // Check if user exists
    $checkUser = $conn->prepare("SELECT u_id FROM user_details WHERE u_id = ?");
    $checkUser->bind_param("i", $u_id);
    $checkUser->execute();
    
    if ($checkUser->get_result()->num_rows === 0) {
        throw new Exception("User with ID $u_id does not exist");
    }

    // Check if record exists for this user
    $checkExpense = $conn->prepare("SELECT u_id FROM userwise_expense_amount WHERE u_id = ?");
    $checkExpense->bind_param("i", $u_id);
    $checkExpense->execute();
    $expenseExists = $checkExpense->get_result()->num_rows > 0;
    $checkExpense->close();

    if ($expenseExists) {
        // Update existing record
        $stmt = $conn->prepare("
            UPDATE userwise_expense_amount 
            SET total_expense_amount = ?, updated_at = ?
            WHERE u_id = ?
        ");
        $stmt->bind_param("dsi", $total_expense_amount, $updated_at, $u_id);
        $action = "updated";
    } else {
        // Insert new record (assuming auto-increment ID column exists)
        $stmt = $conn->prepare("
            INSERT INTO userwise_expense_amount 
            (u_id, total_expense_amount, updated_at) 
            VALUES (?, ?, ?)
        ");
        $stmt->bind_param("ids", $u_id, $total_expense_amount, $updated_at);
        $action = "added";
    }
    
    if ($stmt->execute()) {
        $response = [
            'success' => true,
            'message' => "Expense record $action successfully",
            'data' => [
                'u_id' => $u_id,
                'total_expense_amount' => $total_expense_amount,
                'updated_at' => $updated_at,
                'action' => $action
            ]
        ];
    } else {
        throw new Exception("Database error: " . $stmt->error);
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
        'error_details' => [
            'u_id' => $u_id,
            'amount' => $total_expense_amount
        ]
    ];
}

echo json_encode($response);

// Close connections
if (isset($stmt)) $stmt->close();
if (isset($checkUser)) $checkUser->close();
$conn->close();
?>