<?php

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');
date_default_timezone_set('Asia/Kolkata');

// Handle preflight request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
require_once 'config.php'; // Include your database configuration file

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "error" => "Database connection failed: " . $conn->connect_error
    ]));
}

// Handle Attendance Check
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['user_id'])) {
        echo json_encode([
            "success" => false,
            "error" => "Missing required field: user_id"
        ]);
        exit;
    }

    $user_id = intval($data['user_id']);
    $today = date('Y-m-d');

    // Modified query to check for active session (not logged out)
    $sql = "SELECT 
                attn_id, 
                login_timestamp, 
                login_lat_long, 
                is_logged_out,
                logout_timestamp,
                logout_lat_long
            FROM attendance_details 
            WHERE user_id = ? 
            AND DATE(login_timestamp) = ?
            AND is_logged_out = 0
            ORDER BY login_timestamp DESC
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Check if there's any record for today (even if logged out)
        $sql_all = "SELECT 
                        attn_id, 
                        login_timestamp, 
                        login_lat_long, 
                        is_logged_out,
                        logout_timestamp,
                        logout_lat_long
                    FROM attendance_details 
                    WHERE user_id = ? 
                    AND DATE(login_timestamp) = ?
                    ORDER BY login_timestamp DESC
                    LIMIT 1";
        
        $stmt_all = $conn->prepare($sql_all);
        $stmt_all->bind_param("is", $user_id, $today);
        $stmt_all->execute();
        $result_all = $stmt_all->get_result();
        
        if ($result_all->num_rows === 0) {
            echo json_encode([
                "success" => true,
                "has_login" => false,
                "message" => "No login record found for today"
            ]);
        } else {
            $row = $result_all->fetch_assoc();
            echo json_encode([
                "success" => true,
                "has_login" => true,
                "is_active_session" => false,
                "attendance" => [
                    "attn_id" => $row['attn_id'],
                    "login_timestamp" => $row['login_timestamp'],
                    "login_lat_long" => $row['login_lat_long'],
                    "is_logged_out" => (bool)$row['is_logged_out'],
                    "logout_timestamp" => $row['logout_timestamp'] ?? null,
                    "logout_lat_long" => $row['logout_lat_long'] ?? null
                ],
                "message" => "Session was logged out"
            ]);
        }
        $stmt_all->close();
    } else {
        $row = $result->fetch_assoc();
        $response = [
            "success" => true,
            "has_login" => true,
            "is_active_session" => true,
            "attendance" => [
                "attn_id" => $row['attn_id'],
                "login_timestamp" => $row['login_timestamp'],
                "login_lat_long" => $row['login_lat_long'],
                "is_logged_out" => false
            ],
            "message" => "Active login session found"
        ];
        
        echo json_encode($response);
    }
    
    $stmt->close();
}

$conn->close();
?>