<?php
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'debug_filtered_user_report.log');
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Receive JSON POST data
$data = json_decode(file_get_contents("php://input"), true);
$filter = $data['filter'] ?? 'all';

$whereClause = "WHERE u_is_del = 0";

switch ($filter) {
    case "active":
        $whereClause .= " AND u_active = 1";
        break;
    case "present":
        $whereClause .= " AND is_logged_out = 0";
        break;
    case "absent":
        $whereClause .= " AND (is_logged_out IS NULL OR is_logged_out != 1)";
        break;
    default:
        // no additional condition
        break;
}

try {
    $query = "
        SELECT 
            user_id, u_fname, u_mname, u_lname, u_gender, u_email, u_mob, 
            u_city, u_state, u_country, u_zip_code, u_street_addr, u_organization, 
            u_cv, u_created_at, u_updated_at, u_active, is_logged_out 
        FROM user_details 
        $whereClause
    ";

    $stmt = $pdo->query($query);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($users)) {
        echo json_encode(["status" => "error", "message" => "No user records found"]);
        exit();
    }

    $headers = [
        "User ID", "First Name", "Middle Name", "Last Name", "Gender", "Email", "Mobile",
        "City", "State", "Country", "Zip Code", "Street Address", "Organization",
        "CV", "Created At", "Updated At", "Active", "Is Logged Out"
    ];

    $csvContent = "\"" . implode('","', $headers) . "\"\n";

    foreach ($users as $user) {
        $row = [
            $user['user_id'],
            $user['u_fname'],
            $user['u_mname'],
            $user['u_lname'],
            $user['u_gender'],
            $user['u_email'],
            $user['u_mob'],
            $user['u_city'],
            $user['u_state'],
            $user['u_country'],
            $user['u_zip_code'],
            $user['u_street_addr'],
            $user['u_organization'],
            str_replace(["\"", "\r", "\n"], ["\"\"", " ", " "], $user['u_cv']),
            date('d-m-Y H:i', strtotime($user['u_created_at'])),
            date('d-m-Y H:i', strtotime($user['u_updated_at'])),
            $user['u_active'],
            $user['is_logged_out']
        ];

        $csvContent .= "\"" . implode('","', array_map('strval', $row)) . "\"\n";
    }

    $base64Content = base64_encode($csvContent);
    $fileName = "user_report_" . $filter . "_" . date('Ymd_His') . ".csv";

    echo json_encode([
        "status" => "success",
        "file" => $base64Content,
        "file_name" => $fileName
    ]);
} catch (PDOException $e) {
    error_log("User Report Filtered Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Report generation failed"]);
}
?>
