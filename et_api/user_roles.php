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

    // Query to fetch all users and their roles
    $stmt = $pdo->prepare("
        SELECT 
        ur.role_id, 
        ur.role_name, 
        COUNT(ar.u_id) AS user_count
        FROM user_role ur
        LEFT JOIN assigned_role ar ON ur.role_id = ar.role_id AND ar.ass_role_del = 0  
        GROUP BY ur.role_id, ur.role_name;
    ");
    $stmt->execute();

    // Fetch all results
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return JSON response
    echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);


} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
