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
require_once 'auth.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

     // Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $user_id = $auth['user_id'];

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

// SQL query to fetch summarized attendance
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
            WHEN ad.is_logged_out = 1 THEN 'P'
            ELSE 'A'
        END AS attn_status,
        CONCAT(COALESCE(ad.login_lat_long, ''), ' | ', COALESCE(ad.logout_lat_long, '')) AS attn_location,
        ur.role_name,
        CASE
            WHEN ad.is_logged_out = 1 THEN TIME_FORMAT(TIMEDIFF(MAX(ad.logout_timestamp), MIN(ad.login_timestamp)), '%H:%i')
            ELSE 'N/A'
        END AS duration
    FROM attendance_details ad
    JOIN user_details ud ON ad.user_id = ud.u_id
    LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
    LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
    WHERE ud.u_is_del = 0
    AND DATE(ad.login_timestamp) BETWEEN :start_date AND :end_date
";

// Work Reports Query
$workQuery = "
    SELECT 
        wr.user_id,
        DATE(wr.date) AS work_date,
        wr.project_name,
        wr.work_details
    FROM work_reports wr
    JOIN user_details ud ON wr.user_id = ud.u_id
    WHERE wr.date BETWEEN :start_date AND :end_date
    AND ud.u_is_del = 0
";

if ($filter_user_id && strtolower($filter_user_id) !== 'all') {
    $attendanceQuery .= " AND ad.user_id = :user_id";
    $workQuery .= " AND wr.user_id = :user_id";
    $params[":user_id"] = $filter_user_id;
}

$attendanceQuery .= " GROUP BY ad.user_id, DATE(ad.login_timestamp) ORDER BY ad.user_id, attendance_date";

try {
    // Get attendance data
    $stmt = $pdo->prepare($attendanceQuery);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        echo json_encode(["status" => "error", "message" => "No attendance data found."]);
        exit();
    }

    // Get work report data
    $workStmt = $pdo->prepare($workQuery);
    $workStmt->execute($params);
    $workData = $workStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Index work data by user_id and date
    $workIndex = [];
    foreach ($workData as $work) {
        $key = $work['user_id'] . '_' . $work['work_date'];
        $workIndex[$key][] = $work;
    }

    // Group records by user
    $users = [];
    foreach ($rows as $r) {
        $users[$r['user_id']]['name'] = $r['user_name'];
        $users[$r['user_id']]['role'] = $r['role_name'];
        $users[$r['user_id']]['records'][] = $r;
    }

    // Start building CSV
    $csv = "Attendance Calendar Format Report with Work Details\n\n";

    foreach ($users as $uid => $user) {
        $records = $user['records'];
        $attnStatusByDate = [];
        $workDetailsByDate = [];

        foreach ($records as $r) {
            $key = $uid . '_' . $r['attendance_date'];
            $attnStatusByDate[$r['attendance_date']] = $r['attn_status'];
            
            // Get work details for this date
            if (isset($workIndex[$key])) {
                $workDetails = [];
                foreach ($workIndex[$key] as $work) {
                    $workDetails[] = $work['project_name'] . ': ' . str_replace(["\r", "\n"], ' ', $work['work_details']);
                }
                $workDetailsByDate[$r['attendance_date']] = implode(" | ", $workDetails);
            } else {
                $workDetailsByDate[$r['attendance_date']] = '';
            }
        }

        $calendar = [];
        $headers = [];
        $dayLabels = [];
        $present = $absent = $holidays = $extra = 0;

        $start = strtotime($start_date);
        $end = strtotime($end_date);

        while ($start <= $end) {
            $dateStr = date("Y-m-d", $start);
            $headers[] = date("d-M", $start);
            $dayLabels[] = date("D", $start);
            $dow = date("N", $start); // 6=Sat, 7=Sun
            $status = $attnStatusByDate[$dateStr] ?? ($dow >= 6 ? 'H' : 'A');

            if ($status === 'P') $present++;
            if ($status === 'A') $absent++;
            if ($status === 'H') $holidays++;

            $calendar[] = $status;
            $start = strtotime("+1 day", $start);
        }

        $totalDays = count($calendar);
        $workingDays = $totalDays - $holidays;
        $attendanceRate = $workingDays > 0 ? round(($present / $workingDays) * 100, 2) : 0;

        // Add summary and calendar to CSV
        $csv .= "User ID: {$uid}, Name: {$user['name']}, Role: {$user['role']}\n";
        $csv .= "From: {$start_date} To: {$end_date}\n";
        $csv .= "Total Days: {$totalDays}, Working Days: {$workingDays}, Present: {$present}, Absent: {$absent}, Holidays: {$holidays}, Attendance Rate (%): {$attendanceRate}\n";

        $csv .= implode(",", $headers) . ",Attendance,Extra,Holiday,Absent,Total Day of\n";
        $csv .= implode(",", $dayLabels) . "\n";
        $csv .= implode(",", $calendar) . "," . $present . "," . $extra . "," . $holidays . "," . $absent . "," . $totalDays . "\n\n";

        // Add work details section
        $csv .= "Work Details by Date:\n";
        $csv .= "Date,Status,Work Details\n";
        
        $start = strtotime($start_date);
        $end = strtotime($end_date);
        
        while ($start <= $end) {
            $dateStr = date("Y-m-d", $start);
            $key = $uid . '_' . $dateStr;
            $dow = date("N", $start);
            
            $status = $attnStatusByDate[$dateStr] ?? ($dow >= 6 ? 'H' : 'A');
            $workDetails = $workDetailsByDate[$dateStr] ?? '';
            
            $csv .= "{$dateStr},{$status},\"{$workDetails}\"\n";
            $start = strtotime("+1 day", $start);
        }
        
        $csv .= "\n";
    }

    echo json_encode([
        "status" => "success",
        "file_name" => "attendance_calendar_report_{$start_date}_to_{$end_date}.csv",
        "file" => base64_encode($csv)
    ]);

} catch (PDOException $e) {
    error_log("Query Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Server error"]);
}
?>