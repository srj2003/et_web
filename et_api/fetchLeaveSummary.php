<?php
/* -----------------------------------------------------------
 *  fetchLeaveSummary.php  –  Returns fiscal‑year leave summary
 *  -----------------------------------------------------------
 *  Expected JSON body:
 *    {
 *      "user_id": 62,
 *      "financial_year": "2023-24"
 *    }
 *  -----------------------------------------------------------
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

/* ---------- DEBUG / LOGGING ---------- */
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

/* ---------- DB CONFIG ---------- */
include 'config.php';
require_once 'auth.php';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }
    $user_id = $auth['user_id'];
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication server error: ' . $e->getMessage()
    ]);
    exit;
}
$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

/* ---------- READ INPUT ---------- */
$input = json_decode(file_get_contents('php://input'));
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No input data received']);
    exit;
}

$financial_year = isset($input->financial_year) ? trim($input->financial_year) : '';

if (!preg_match('/^(\d{4})-(\d{2})$/', $financial_year, $m)) {
    echo json_encode(['success' => false, 'message' => 'Invalid financial_year']);
    exit;
}

/* ---------- BUILD FY DATE RANGE ---------- */
$startYear  = (int)$m[1];          // e.g. 2023
$endYear    = $startYear + 1;      // 2024
$fyStart    = "$startYear-04-01";  // 1 Apr YYYY
$fyEnd      = "$endYear-03-31";    // 31 Mar YYYY+1

/* ---------- VERIFY USER EXISTS ---------- */
$stmtUser = $conn->prepare("SELECT u_id FROM user_details WHERE u_id = ?");
$stmtUser->bind_param('i', $user_id);
$stmtUser->execute();
$stmtUser->store_result();
if ($stmtUser->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => "User $user_id not found"]);
    exit;
}
$stmtUser->close();

/* =========================================================
 * 1.  FETCH ALL APPROVED LEAVE SPANS FOR THE FY
 * =======================================================*/
$leaveSql = "
    SELECT leave_from_date, leave_to_date
    FROM   leave_track_details
    WHERE  leave_track_created_by = ?
      AND  leave_track_status     = 1        -- approved
      AND (
            leave_from_date BETWEEN ? AND ? OR
            leave_to_date   BETWEEN ? AND ? OR
            (leave_from_date < ? AND leave_to_date > ?)
          )";

$stmtLeave = $conn->prepare($leaveSql);
$stmtLeave->bind_param(
    'issssss',
    $user_id, $fyStart, $fyEnd,
    $fyStart, $fyEnd,
    $fyStart, $fyEnd
);
$stmtLeave->execute();
$resultLeave = $stmtLeave->get_result();

/* ---------- Initialise counters ---------- */
$months          = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
$leaveCounter    = array_fill(0, 12, 0);   // days of leave
$overtimeCounter = array_fill(0, 12, 0);   // Sunday work

/* ---------- Count leave days month‑by‑month ---------- */
while ($row = $resultLeave->fetch_assoc()) {
    $from = new DateTime(max($row['leave_from_date'], $fyStart));
    $to   = new DateTime(min($row['leave_to_date'],   $fyEnd));

    for ($d = $from; $d <= $to; $d->modify('+1 day')) {
        $mNum   = (int)$d->format('n');                     // 1‑12
        $fyIdx  = $mNum >= 4 ? $mNum - 4 : $mNum + 8;      // Apr‑Mar → 0‑11
        $leaveCounter[$fyIdx]++;
    }
}
$stmtLeave->close();

/* =========================================================
 * 2.  COUNT DISTINCT SUNDAY WORKING DAYS (OVERTIME)
 * =======================================================*/
$otSql = "
    SELECT DISTINCT DATE(login_timestamp) AS work_date
    FROM   attendance_details
    WHERE  user_id = ?
      AND  login_timestamp BETWEEN ? AND ?
      AND  DAYOFWEEK(login_timestamp) = 1     -- Sunday = 1
";
$stmtOT = $conn->prepare($otSql);
$stmtOT->bind_param('iss', $user_id, $fyStart, $fyEnd);
$stmtOT->execute();
$resultOT = $stmtOT->get_result();

while ($row = $resultOT->fetch_assoc()) {
    $d      = new DateTime($row['work_date']);
    $mNum   = (int)$d->format('n');
    $fyIdx  = $mNum >= 4 ? $mNum - 4 : $mNum + 8;
    $overtimeCounter[$fyIdx]++;
}
$stmtOT->close();

/* =========================================================
 * 3.  BUILD RESPONSE
 * =======================================================*/
$defaultLeaves       = 21;
$totalLeaveTaken     = array_sum($leaveCounter);
$totalOvertimeDays   = array_sum($overtimeCounter);
$balanceLeave        = $defaultLeaves - $totalLeaveTaken + $totalOvertimeDays;

$monthRows = [];
for ($i = 0; $i < 12; $i++) {
    $monthRows[] = [
        'month'          => $months[$i],
        'leaves_taken'   => $leaveCounter[$i],
        'overtime_days'  => $overtimeCounter[$i],
    ];
}

echo json_encode([
    'success' => true,
    'summary' => [
        'user_id'        => $user_id,
        'financial_year' => $financial_year,
        'default_leave'  => $defaultLeaves,
        'months'         => $monthRows,
        'totals' => [
            'leave_taken'    => $totalLeaveTaken,
            'overtime_days'  => $totalOvertimeDays,
            'balance_leave'  => $balanceLeave
        ]
    ]
], JSON_PRETTY_PRINT);

$conn->close();
?>
