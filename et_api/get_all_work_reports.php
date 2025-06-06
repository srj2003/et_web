<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    $query = "
        SELECT wr.*, 
               CONCAT(ud.u_fname, ' ', COALESCE(ud.u_mname, ''), ' ', ud.u_lname) AS user_name
        FROM work_reports wr
        JOIN user_details ud ON wr.user_id = ud.u_id  /* Changed to u_id to match previous schema */
        ORDER BY wr.`date` DESC  /* Wrapped date in backticks */
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "reports" => $reports,
        "count" => count($reports)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>