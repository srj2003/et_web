<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once "config.php";

// Initialize response
$response = [
    'success' => false,
    'message' => 'Initial state',
    'data' => null,
    'source' => null
];

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['u_id'])) {
        throw new Exception("u_id is required in request body");
    }
    
    $u_id = $input['u_id']; // Keeping as string if that's what you want

    // Database connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // First try to get from userwise_expense_amount
    $query = "SELECT u_id, total_expense_amount FROM userwise_expense_amount WHERE u_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $u_id); // Using "s" for string parameter
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Data found in userwise_expense_amount
        $row = $result->fetch_assoc();
        $response = [
            'success' => true,
            'message' => 'Data found in userwise_expense_amount',
            'data' => [
                'u_id' => $row['u_id'], // Keeping original format
                'total_expense_amount' => (float)$row['total_expense_amount']
            ],
            'source' => 'userwise_expense_amount'
        ];
    } else {
        // Fallback to user_role via assigned_role
        $query = "SELECT ur.total_expense_amount 
                 FROM assigned_role ar
                 JOIN user_role ur ON ar.role_id = ur.role_id
                 WHERE ar.u_id = ? AND ar.ass_role_del = 0 AND ur.role_is_del = 0";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $u_id); // Using "s" for string parameter
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $response = [
                'success' => true,
                'message' => 'Data fetched from user_role (fallback)',
                'data' => [
                    'u_id' => $u_id,
                    'total_expense_amount' => (float)$row['total_expense_amount']
                ],
                'source' => 'user_role'
            ];
        } else {
            throw new Exception("No expense data found for user ID: $u_id");
        }
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
        'data' => null,
        'source' => null
    ];
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
    
    echo json_encode($response, JSON_PRETTY_PRINT);
}
?>