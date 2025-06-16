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
$attendanceQuery = "
    SELECT 
        ad.attn_id,
        ad.user_id,
        ud.u_fname,
        ud.u_lname,
        CONCAT(ud.u_fname, ' ', ud.u_lname) AS user_name,
        DATE(ad.login_timestamp) AS attendance_date,
        MIN(TIME(ad.login_timestamp)) AS check_in,
        MAX(TIME(ad.logout_timestamp)) AS check_out,
        CASE 
            WHEN ad.is_logged_out = 1 THEN 'present'
            ELSE 'absent'
        END AS attn_status,
        CONCAT(COALESCE(ad.login_lat_long, ''), ' | ', COALESCE(ad.logout_lat_long, '')) AS attn_location,
        ur.role_name,
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
        END AS duration
    FROM attendance_details ad
    JOIN user_details ud ON ad.user_id = ud.u_id
    LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
    LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
    WHERE ud.u_is_del = 0
    AND DATE(ad.login_timestamp) BETWEEN :start_date AND :end_date
";

if ($filter_user_id) {
    $attendanceQuery .= " AND ad.user_id = :user_id";
    $params[":user_id"] = $filter_user_id;
}

$attendanceQuery .= " GROUP BY ad.user_id, DATE(ad.login_timestamp)";

// Work Reports Query remains the same
$workQuery = "
    SELECT 
        wr.user_id,
        ud.u_fname,
        ud.u_lname,
        CONCAT(ud.u_fname, ' ', ud.u_lname) AS user_name,
        wr.project_name,
        wr.work_details,
        wr.date AS work_date,
        ur.role_name
    FROM work_reports wr
    JOIN user_details ud ON wr.user_id = ud.u_id
    LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
    LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
    WHERE wr.date BETWEEN :start_date AND :end_date
    AND ud.u_is_del = 0
";

if ($filter_user_id) {
    $workQuery .= " AND wr.user_id = :user_id";
}

try {
    $attendanceStmt = $pdo->prepare($attendanceQuery);
    $attendanceStmt->execute($params);
    $attendanceData = $attendanceStmt->fetchAll(PDO::FETCH_ASSOC);

    $workStmt = $pdo->prepare($workQuery);
    $workStmt->execute($params);
    $workData = $workStmt->fetchAll(PDO::FETCH_ASSOC);

    // Map work data to user_id + date
    $workIndex = [];
    foreach ($workData as $work) {
        $key = $work['user_id'] . '_' . $work['work_date'];
        $workIndex[$key][] = $work;
    }

    // Generate CSV with Duration
    $csvContent = "Attendance ID,User ID,Name,Date,Check In,Check Out,Duration,Status,Location,Role,Project,Work Details\n";
    $processedWorkKeys = [];

    foreach ($attendanceData as $attn) {
        $key = $attn['user_id'] . '_' . $attn['attendance_date'];
        $workEntries = $workIndex[$key] ?? [];

        if (empty($workEntries)) {
            // Attendance only row
            $csvContent .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"\",\"\"\n",
                $attn['attn_id'],
                $attn['user_id'],
                $attn['user_name'],
                $attn['attendance_date'],
                $attn['check_in'] ?? 'N/A',
                $attn['check_out'] ?? 'N/A',
                $attn['duration'],
                $attn['attn_status'],
                str_replace('"', '""', $attn['attn_location']),
                $attn['role_name']
            );
        } else {
            foreach ($workEntries as $work) {
                $csvContent .= sprintf(
                    "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    $attn['attn_id'],
                    $attn['user_id'],
                    $attn['user_name'],
                    $attn['attendance_date'],
                    $attn['check_in'] ?? 'N/A',
                    $attn['check_out'] ?? 'N/A',
                    $attn['duration'],
                    $attn['attn_status'],
                    str_replace('"', '""', $attn['attn_location']),
                    $attn['role_name'],
                    str_replace('"', '""', $work['project_name']),
                    str_replace(["\"", "\r", "\n"], ["\"\"", " ", " "], $work['work_details'])
                );
                $processedWorkKeys[$key][] = $work['work_details'];
            }
        }
    }

    // Work entries without attendance
    foreach ($workData as $work) {
        $key = $work['user_id'] . '_' . $work['work_date'];
        if (!isset($processedWorkKeys[$key]) || !in_array($work['work_details'], $processedWorkKeys[$key])) {
            $csvContent .= sprintf(
                "\"\",\"%s\",\"%s\",\"%s\",\"\",\"\",\"N/A\",\"\",\"\",\"%s\",\"%s\",\"%s\"\n",
                $work['user_id'],
                $work['user_name'],
                $work['work_date'],
                $work['role_name'],
                str_replace('"', '""', $work['project_name']),
                str_replace(["\"", "\r", "\n"], ["\"\"", " ", " "], $work['work_details'])
            );
        }
    }

    if (trim($csvContent) === "") {
        echo json_encode(["status" => "error", "message" => "No data found"]);
        exit();
    }

    $base64Content = base64_encode($csvContent);
    echo json_encode([
        "status" => "success",
        "file" => $base64Content,
        "file_name" => "report_{$start_date}_to_{$end_date}.csv"
    ]);
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Report generation failed"]);
}
?>