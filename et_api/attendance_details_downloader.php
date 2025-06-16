<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Include database configuration
require_once 'config.php';

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Query to fetch all users and their roles
    $query = "
        SELECT 
            ur.role_id, 
            ur.role_name, 
            COUNT(ar.u_id) AS user_count
        FROM user_role ur
        LEFT JOIN assigned_role ar ON ur.role_id = ar.role_id AND ar.ass_role_del = 0  
        GROUP BY ur.role_id, ur.role_name
    ";

    $result = $conn->query($query);

    if ($result) {
        $users = array();
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    } else {
        throw new Exception("Query failed: " . $conn->error);
    }

    // Close connection
    $conn->close();
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
