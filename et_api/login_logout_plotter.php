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

    // Get JSON input
    $raw_input = file_get_contents("php://input");
    $input = json_decode($raw_input, true);
    
    // Debug information
    $debug_info = [
        "raw_input" => $raw_input,
        "decoded_input" => $input,
        "user_id_set" => isset($input['user_id']),
        "attn_id_set" => isset($input['attn_id']),
        "user_id_value" => $input['user_id'] ?? null,
        "attn_id_value" => $input['attn_id'] ?? null
    ];
    
    // Validate user_id
    if (!isset($input['user_id']) || !is_numeric($input['user_id']) || 
    !isset($input['attn_id']) || !is_numeric($input['attn_id'])) {
        http_response_code(400);
        echo json_encode([
            "error" => "Valid user_id and attn_id are required",
            "debug_info" => $debug_info
        ]);
        exit;
    }

    $user_id = intval($input['user_id']);
    $attn_id = intval($input['attn_id']);

    // Query to get login and logout locations
    $stmt = $pdo->prepare("
        SELECT 
            attn_id,
            login_lat_long,
            logout_lat_long
        FROM attendance_details 
        WHERE user_id = :user_id 
        AND attn_id = :attn_id
    ");

    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':attn_id', $attn_id, PDO::PARAM_INT);
    $stmt->execute();

     // Fetch the result
     $result = $stmt->fetch(PDO::FETCH_ASSOC);

     if (!$result) {
         http_response_code(404);
         echo json_encode(["error" => "No attendance record found for the given user_id and attn_id"]);
         exit;
     }
 
     // Process the result to split lat_long into separate lat and long
     if ($result['login_lat_long']) {
         $login_coords = explode(', ', $result['login_lat_long']);
         $result['login_lat'] = floatval($login_coords[0]);
         $result['login_long'] = floatval($login_coords[1]);
     }
     
     if ($result['logout_lat_long']) {
         $logout_coords = explode(', ', $result['logout_lat_long']);
         $result['logout_lat'] = floatval($logout_coords[0]);
         $result['logout_long'] = floatval($logout_coords[1]);
     }
     
     // Remove the original lat_long fields
     unset($result['login_lat_long']);
     unset($result['logout_lat_long']);
        


    // Return JSON response
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?> 