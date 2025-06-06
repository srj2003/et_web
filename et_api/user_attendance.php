<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'config.php';
try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = isset($data['user_id']) ? $data['user_id'] : null;
    $startDate = isset($data['start_date']) ? $data['start_date'] : null;
    $endDate = isset($data['end_date']) ? $data['end_date'] : null;

    // Base query
    $query = "
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
            CONCAT(ad.login_lat_long, ' | ', COALESCE(ad.logout_lat_long, '')) AS attn_location,
            ur.role_name
        FROM attendance_details ad
        JOIN user_details ud ON ad.user_id = ud.u_id
        LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
        LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
        WHERE ud.u_is_del = 0
    ";

    // Add conditions if user_id is provided
    if ($userId) {
        $query .= " AND ad.user_id = :user_id";

        // Add date range conditions if provided
        if ($startDate && $endDate) {
            $query .= " AND DATE(ad.login_timestamp) BETWEEN :start_date AND :end_date";
        }
    }

    $query .= " GROUP BY ad.user_id, DATE(ad.login_timestamp) ORDER BY ad.login_timestamp DESC";

    $stmt = $pdo->prepare($query);

    // Bind parameters
    if ($userId) {
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

        if ($startDate && $endDate) {
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
        }
    }

    $stmt->execute();
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate summary statistics
    $summary = [];
    foreach ($attendance as $record) {
        $userId = $record['user_id'];
        if (!isset($summary[$userId])) {
            $summary[$userId] = [
                'user_id' => $userId,
                'user_name' => $record['user_name'],
                'role_name' => $record['role_name'],
                'total_days' => 0,
                'present_days' => 0,
                'absent_days' => 0,
                'last_attendance' => null
            ];
        }

        $summary[$userId]['total_days']++;
        if ($record['attn_status'] === 'present') {
            $summary[$userId]['present_days']++;
        } else {
            $summary[$userId]['absent_days']++;
        }

        if (
            !$summary[$userId]['last_attendance'] ||
            strtotime($record['attendance_date']) > strtotime($summary[$userId]['last_attendance'] === null)
        ) {
            $summary[$userId]['last_attendance'] = $record['attendance_date'];
        }
    }

    // Return both detailed records and summary
    echo json_encode([
        'attendance' => $attendance,
        'summary' => array_values($summary)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
