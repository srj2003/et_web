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

    // Query to fetch the role name for the given user ID
    $stmt = $pdo->prepare("
        SELECT 
            ur.role_name
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

    // Fetch the role name
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($role) {
        // Return the role name as JSON
        echo json_encode($role, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    } else {
        // If no role is found, return an error
        echo json_encode(["error" => "No role found for the given user ID"]);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
