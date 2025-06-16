<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'debug.log');
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

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["start_date"], $data["end_date"])) {
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit();
}

$start_date = $data["start_date"];
$end_date = $data["end_date"];
$filter_user_id = $data["user_id"] ?? null;

$params = [
    ":start_date" => $start_date,
    ":end_date" => $end_date
];

// Attendance Query with Duration Calculation
$query = "
    SELECT 
        ad.attn_id,
        ad.user_id,
        ud.u_fname,
        ud.u_lname,
        CONCAT(ud.u_fname, ' ', ud.u_lname) AS user_name,
        DATE(ad.login_timestamp) AS date,
        TIME_FORMAT(MIN(TIME(ad.login_timestamp)), '%h:%i %p') AS login_time,
        TIME_FORMAT(MAX(TIME(ad.logout_timestamp)), '%h:%i %p') AS logout_time,
        CASE 
            WHEN ad.is_logged_out = 1 THEN 'Present'
            ELSE 'Absent'
        END AS status,
        CASE
            WHEN ad.is_logged_out = 1 THEN
                TIME_FORMAT(
                    TIMEDIFF(
                        MAX(ad.logout_timestamp),
                        MIN(ad.login_timestamp)
                    ),
                    '%H:%i'
                )
            ELSE 'N/A'
        END AS total_hours,
        CONCAT(COALESCE(ad.login_lat_long, ''), ' | ', COALESCE(ad.logout_lat_long, '')) AS location,
        ur.role_name
    FROM attendance_details ad
    JOIN user_details ud ON ad.user_id = ud.u_id
    LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
    LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
    WHERE ud.u_is_del = 0
    AND DATE(ad.login_timestamp) BETWEEN :start_date AND :end_date
";

if ($filter_user_id) {
    $query .= " AND ad.user_id = :user_id";
    $params[":user_id"] = $filter_user_id;
}

$query .= " GROUP BY ad.user_id, DATE(ad.login_timestamp)
           ORDER BY DATE(ad.login_timestamp) DESC, ad.user_id";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $attendanceData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formattedData = array_map(function($row) {
        return [
            'date' => date('d M Y', strtotime($row['date'])),
            'login_time' => $row['login_time'] ?? 'N/A',
            'logout_time' => $row['logout_time'] ?? 'N/A',
            'total_hours' => $row['total_hours'],
            'status' => $row['status'],
            'location' => $row['location'],
            'user_name' => $row['user_name'],
            'role_name' => $row['role_name']
        ];
    }, $attendanceData);

    if (empty($formattedData)) {
        echo json_encode([
            "status" => "success",
            "data" => [],
            "message" => "No attendance records found for the selected date range"
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "data" => $formattedData
        ]);
    }

} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch attendance data"
    ]);
}
?>