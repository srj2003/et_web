<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'config.php';

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get the JSON payload from the request
    $input = json_decode(file_get_contents("php://input"), true);

    // Validate input
    if (!isset($input['user_id'])) {
        echo json_encode(["error" => "User ID is required"]);
        exit();
    }

    $user_id = $input['user_id'];

    // Query to fetch the role_id for the given user ID
    $stmt = $pdo->prepare("
        SELECT 
            ar.role_id
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

    // Fetch the role_id
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($role) {
        // Return the role_id as JSON
        echo json_encode($role, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    } else {
        // If no role is found, return an error
        echo json_encode(["error" => "No role found for the given user ID"]);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
