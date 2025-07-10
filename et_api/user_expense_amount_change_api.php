<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Authenticate user
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit();
    }
    $user_id = $auth['user_id'];

    // Query to fetch role details including total_expense_amount
    $stmt = $pdo->prepare("
        SELECT 
            ur.role_name,
            ur.total_expense_amount,
            ur.role_id,
            ur.role_active
        FROM 
            user_details ud
        INNER JOIN 
            assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
        INNER JOIN 
            user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
        WHERE 
            ud.u_id = :user_id
    ");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    // Fetch the role details
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($role) {
        // Format the response
        $response = [
            'status' => 'success',
            'data' => [
                'role_name' => $role['role_name'],
                'total_expense_amount' => (float)$role['total_expense_amount'],
                'role_id' => (int)$role['role_id'],
                'is_active' => (bool)$role['role_active'],
                'last_updated' => date('Y-m-d H:i:s') // Current timestamp for reference
            ]
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'No active role found for user'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error_details' => $e->getMessage()
    ]);
}
?>