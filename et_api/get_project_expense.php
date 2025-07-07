<?php
// get_project_expenses.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../objects/user.php';
include_once '../config/core.php';
include_once '../libs/php-jwt-master/src/BeforeValidException.php';
include_once '../libs/php-jwt-master/src/ExpiredException.php';
include_once '../libs/php-jwt-master/src/SignatureInvalidException.php';
include_once '../libs/php-jwt-master/src/JWT.php';
use \Firebase\JWT\JWT;

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$token = isset($data->token) ? $data->token : "";

if($token) {
    try {
        $decoded = JWT::decode($token, $key, array('HS256'));
        
        $user_id = $decoded->data->user_id;
        
        // Get all projects assigned to this user
        $query = "SELECT pa.expense_type_id, p.project_name 
                  FROM project_assignments pa
                  JOIN expense_types p ON pa.expense_type_id = p.expense_type_id
                  WHERE pa.u_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $result = array();
        
        foreach($projects as $project) {
            // Get total expenses for each project
            $expense_query = "SELECT SUM(expense_total_amount) as total_expense 
                             FROM expense_track_details 
                             WHERE expense_type_id = :expense_type_id";
            
            $expense_stmt = $db->prepare($expense_query);
            $expense_stmt->bindParam(':expense_type_id', $project['expense_type_id']);
            $expense_stmt->execute();
            
            $expense_data = $expense_stmt->fetch(PDO::FETCH_ASSOC);
            
            $result[] = array(
                'project_id' => $project['expense_type_id'],
                'project_name' => $project['project_name'],
                'total_expense' => $expense_data['total_expense'] ? $expense_data['total_expense'] : 0
            );
        }
        
        http_response_code(200);
        echo json_encode(array(
            "status" => "success",
            "data" => $result
        ));
        
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(array(
            "status" => "error",
            "message" => "Access denied.",
            "error" => $e->getMessage()
        ));
    }
} else {
    http_response_code(401);
    echo json_encode(array("status" => "error", "message" => "Access denied."));
}
?>