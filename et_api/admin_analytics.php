<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php'; // our database configuration file

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$range = isset($_GET['range']) ? $_GET['range'] : 'today';
$dataType = isset($_GET['dataType']) ? $_GET['dataType'] : 'users';

$response = array();

// Add custom date range handling
if ($range === 'custom' && isset($_GET['start']) && isset($_GET['end'])) {
    $startDate = $_GET['start'];
    $endDate = $_GET['end'];
} else {
    // Use existing date range logic
    $today = date('Y-m-d');
    $startDate = $today;
    $endDate = $today;

    switch ($range) {
        case 'week':
            $startDate = date('Y-m-d', strtotime('-1 week'));
            break;
        case 'month':
            $startDate = date('Y-m-d', strtotime('-1 month'));
            break;
        case 'year':
            $startDate = date('Y-m-d', strtotime('-1 year'));
            break;
    }
}

if ($dataType === 'users') {
    // Get total users count
    $totalUsersQuery = "SELECT COUNT(*) as total FROM user_details WHERE u_is_del = 0";
    $totalUsersResult = $conn->query($totalUsersQuery);
    $totalUsers = $totalUsersResult->fetch_assoc()['total'];

    // Get active users count (users with is_logged_out=0 in attendance_details)
    $activeUsersQuery = "SELECT COUNT(DISTINCT a.user_id) as active 
                         FROM attendance_details a
                         JOIN user_details u ON a.user_id = u.u_id
                         WHERE a.is_logged_out = 0 
                         AND DATE(a.login_timestamp) BETWEEN '$startDate' AND '$endDate'
                         AND u.u_is_del = 0";
    $activeUsersResult = $conn->query($activeUsersQuery);
    $activeUsers = $activeUsersResult->fetch_assoc()['active'];

    $response = array(
        'totalUsers' => (int)$totalUsers,
        'activeUsers' => (int)$activeUsers,
        'inactiveUsers' => (int)($totalUsers - $activeUsers)
    );
} elseif ($dataType === 'expenses') {
    $dateFilter = "";
    $monthlyDateFilter = "";

    // Handle date range filtering
    if (isset($_GET['range'])) {
        switch ($_GET['range']) {
            case 'today':
                $dateFilter = "AND DATE(etd.expense_track_created_at) = CURDATE()";
                $monthlyDateFilter = "WHERE DATE(expense_track_created_at) = CURDATE()";
                break;
            case 'week':
                $dateFilter = "AND etd.expense_track_created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
                $monthlyDateFilter = "WHERE expense_track_created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
                break;
            case 'month':
                $dateFilter = "AND etd.expense_track_created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
                $monthlyDateFilter = "WHERE expense_track_created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
                break;
            case 'year':
                $dateFilter = "AND etd.expense_track_created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
                $monthlyDateFilter = "WHERE expense_track_created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
                break;
            case 'custom':
                if (isset($_GET['start']) && isset($_GET['end'])) {
                    $start = $_GET['start'];
                    $end = $_GET['end'];
                    $dateFilter = "AND DATE(etd.expense_track_created_at) BETWEEN '$start' AND '$end'";
                    $monthlyDateFilter = "WHERE DATE(expense_track_created_at) BETWEEN '$start' AND '$end'";
                }
                break;
        }
    }

    // Get monthly expenses data for line chart
    $monthlyExpensesQuery = "
        SELECT 
            DATE_FORMAT(expense_track_created_at, '%Y-%m') as month,
            SUM(expense_total_amount) as total
        FROM expense_track_details
        $monthlyDateFilter
        GROUP BY DATE_FORMAT(expense_track_created_at, '%Y-%m')
        ORDER BY month
    ";

    $monthlyResult = $conn->query($monthlyExpensesQuery);
    $monthlyLabels = array();
    $monthlyData = array();

    while ($row = $monthlyResult->fetch_assoc()) {
        $monthlyLabels[] = date('M Y', strtotime($row['month'] . '-01'));
        $monthlyData[] = (float)$row['total'];
    }

    // Query for expense categories
    $categoriesQuery = "
        SELECT 
            et.expense_type_name,
            COALESCE(SUM(etd.expense_total_amount), 0) as total_amount
        FROM 
            expense_types et
        LEFT JOIN 
            expense_track_details etd ON et.expense_type_id = etd.expense_type_id
        WHERE 
            et.expense_type_is_active = 1
            $dateFilter
        GROUP BY 
            et.expense_type_id, et.expense_type_name
        ORDER BY 
            total_amount DESC
    ";

    $categoryResult = $conn->query($categoriesQuery);
    $categories = array();
    $amounts = array();

    while ($row = $categoryResult->fetch_assoc()) {
        $categories[] = $row['expense_type_name'];
        $amounts[] = (float)$row['total_amount'];
    }

    // Combine both sets of data in the response
    $response = array(
        'monthlyExpenses' => array(
            'labels' => $monthlyLabels,
            'data' => $monthlyData
        ),
        'expenseCategories' => array(
            'labels' => $categories,
            'data' => $amounts
        ),
        'totalExpenses' => array_sum($monthlyData)
    );
}

$conn->close();

echo json_encode($response);
