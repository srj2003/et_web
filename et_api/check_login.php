<?php
// CORS headers MUST be at the very top of your PHP file, before any output or early exits.
header("Access-Control-Allow-Origin: *"); // Allows requests from any origin. For production, consider specifying your exact frontend origin(s).
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request:
// The browser sends an OPTIONS request first to check permissions.
// You must respond to it with the CORS headers, then exit.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit; // It's crucial to exit here *after* the headers are sent.
}

// Ensure display errors are OFF for production to prevent "Unexpected token '<'" errors.
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL); // Keep for logging, but not displaying.

require_once 'config.php';
require_once 'auth.php';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            "success" => false,
            "error" => $auth['message']
        ]);
        exit;
    }

    $user_id = $auth['user_id'];
    $today = date('Y-m-d');

    $stmt = $pdo->prepare("
        SELECT attn_id, login_timestamp, login_lat_long, is_logged_out, logout_timestamp, logout_lat_long
        FROM attendance_details 
        WHERE user_id = ? AND DATE(login_timestamp) = ? AND is_logged_out = 0
        ORDER BY login_timestamp DESC LIMIT 1
    ");
    $stmt->execute([$user_id, $today]);

    if ($stmt->rowCount() === 0) {
        $stmt_all = $pdo->prepare("
            SELECT attn_id, login_timestamp, login_lat_long, is_logged_out, logout_timestamp, logout_lat_long
            FROM attendance_details 
            WHERE user_id = ? AND DATE(login_timestamp) = ?
            ORDER BY login_timestamp DESC LIMIT 1
        ");
        $stmt_all->execute([$user_id, $today]);

        if ($stmt_all->rowCount() === 0) {
            echo json_encode([
                "success" => true,
                "has_login" => false,
                "message" => "No login record found for today"
            ]);
            exit;
        }

        $row = $stmt_all->fetch(PDO::FETCH_ASSOC);
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
        exit;
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
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
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "Server error: " . $e->getMessage()
    ]);
    exit;
}