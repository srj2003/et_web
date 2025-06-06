<?php
header("Access-Control-Allow-Origin: *");//edited
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers:Content-Type, Accept");//edited
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['user_id']) || !isset($data['startDate']) || !isset($data['endDate'])) {
    echo json_encode(['error' => 'Missing parameters']);
    exit();
}

$user_id = $data['user_id'];
$startDate = $data['startDate'];
$endDate = $data['endDate'];

require_once 'config.php'; // Include your database configuration file

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['error' => "Connection failed: " . $conn->connect_error]));
}

// Calculate total working days excluding Sundays
$totalWorkingDays = 0;
$start = new DateTime($startDate);
$end = new DateTime($endDate);
$interval = new DateInterval('P1D');
$period = new DatePeriod($start, $interval, $end->modify('+1 day'));

$workingDays = [];
$debugDays = []; // For debugging

foreach ($period as $date) {
    $dayOfWeek = $date->format('N');
    $dateStr = $date->format('Y-m-d');
    if ($dayOfWeek != 7) { // Exclude Sundays
        $workingDays[] = $dateStr;
        $totalWorkingDays++;
    }
    $debugDays[$dateStr] = $dayOfWeek; // Store day of week for each date
}

// Keep only one simple debug query for basic troubleshooting
$debug_sql = "SELECT COUNT(*) as count 
              FROM attendance_details 
              WHERE user_id = ? 
              AND DATE(login_timestamp) >= ? 
              AND DATE(login_timestamp) <= ?";

$debug_stmt = $conn->prepare($debug_sql);
$debug_stmt->bind_param("iss", $user_id, $startDate, $endDate);
$debug_stmt->execute();
$debug_result = $debug_stmt->get_result();
$debug_count = $debug_result->fetch_assoc()['count'];

// Main query
$sql = "SELECT DATE(login_timestamp) as attn_date, 
               login_timestamp AS first_login, 
               logout_timestamp AS last_logout,
               is_logged_out
        FROM attendance_details 
        WHERE user_id = ? 
        AND DATE(login_timestamp) >= ? 
        AND DATE(login_timestamp) <= ?
        ORDER BY attn_date, login_timestamp ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $user_id, $startDate, $endDate);
$stmt->execute();
$result = $stmt->get_result();

if ($result === false) {
    die(json_encode(['error' => 'Query execution failed: ' . $stmt->error]));
}

$attendedDays = 0;
$lateEntryDays = 0;
$totalCheckInTime = 0;
$totalCheckOutTime = 0;
$totalHoursWorked = 0;
$presentDays = [];

while ($row = $result->fetch_assoc()) {
    // Only count day as attended if is_logged_out = 1
    if ($row['is_logged_out'] == 1) {
        $attendedDays++;
        $presentDays[] = $row['attn_date'];

        $firstLogin = new DateTime($row['first_login']);
        $lastLogout = new DateTime($row['last_logout']);

        // Convert 6:XX AM/PM logout times to 18:XX (6 PM) if they're meant to be evening times
        if ($lastLogout->format('H') < 12) {
            $lastLogout->modify('+12 hours');
        }

        // Create 6:45 PM timestamp for the same date
        $lateLogoutLimit = new DateTime($row['attn_date'] . ' 18:45:00');

        // If logout is after 6:45 PM, use 6:45 PM instead
        if ($lastLogout > $lateLogoutLimit) {
            $lastLogout = clone $lateLogoutLimit;
        }

        // For average time calculation, store hours and minutes separately
        $loginMinutes = $firstLogin->format('H') * 60 + $firstLogin->format('i');
        $logoutMinutes = $lastLogout->format('H') * 60 + $lastLogout->format('i');

        $totalCheckInTime += $loginMinutes;
        $totalCheckOutTime += $logoutMinutes;

        // Consider late entry if check-in is after 09:45 AM
        if ($firstLogin->format('H:i') > '09:45') {
            $lateEntryDays++;
        }

        $workingStart = new DateTime($row['attn_date'] . ' 09:30:00');
        $workingEnd = new DateTime($row['attn_date'] . ' 18:30:00');

        // Calculate working hours
        $workStart = max($firstLogin, $workingStart);
        $workEnd = min($lastLogout, $workingEnd);

        if ($workStart < $workEnd) {
            $workDuration = $workEnd->getTimestamp() - $workStart->getTimestamp();
            $totalHoursWorked += $workDuration / 3600; // Convert to hours
        }
    }
}

// Calculate absent days by checking missing days from working days list
$absentDays = 0;
foreach ($workingDays as $workDay) {
    if (!in_array($workDay, $presentDays)) {
        // Check if this day is not a Sunday
        $dayDate = new DateTime($workDay);
        if ($dayDate->format('N') != 7) {
            $absentDays++;
        }
    }
}

// Calculate attendance rate based on non-Sunday working days
$attendanceRate = ($totalWorkingDays > 0) ? ($attendedDays / $totalWorkingDays) * 100 : 0;

// Compute average check-in and check-out times
if ($attendedDays > 0) {
    $avgCheckInMinutes = $totalCheckInTime / $attendedDays;
    $avgCheckOutMinutes = $totalCheckOutTime / $attendedDays;

    $avgCheckIn = sprintf(
        "%02d:%02d",
        floor($avgCheckInMinutes / 60),
        $avgCheckInMinutes % 60
    );

    $avgCheckOut = sprintf(
        "%02d:%02d",
        floor($avgCheckOutMinutes / 60),
        $avgCheckOutMinutes % 60
    );
} else {
    $avgCheckIn = null;
    $avgCheckOut = null;
}

// Calculate daily average work hours
$dailyAvgWorkHours = ($attendedDays > 0) ? ($totalHoursWorked / $attendedDays) : 0;

$response = [
    'status' => 'success',
    'debug_info' => [
        'total_records_found' => $debug_count,
        'working_days' => $workingDays,
        'present_days' => $presentDays,
        'all_days' => $debugDays
    ],
    'totalWorkingDays' => $totalWorkingDays,
    'attendedDays' => $attendedDays,
    'absentDays' => $absentDays,
    'attendanceRate' => round($attendanceRate, 2),
    'lateEntryDays' => $lateEntryDays,
    'avgCheckInTime' => $avgCheckIn,
    'avgCheckOutTime' => $avgCheckOut,
    'totalHoursWorked' => round($totalHoursWorked, 2),
    'dailyAvgWorkHours' => round($dailyAvgWorkHours, 2)
];

echo json_encode($response);
$conn->close();
?>