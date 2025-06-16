<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'config.php';

try {
    // Connect to the database using mysqli
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check for connection errors
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Check if user_id is provided in the GET request
    if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
        echo json_encode(["error" => "User ID is required"]);
        exit();
    }

    $user_id = intval($_GET['user_id']); // Ensure user_id is an integer

    // Query to fetch the u_pro_img for the given user ID
    $sql = "SELECT u_pro_img FROM user_details WHERE u_id = ? AND u_is_del = 0";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("i", $user_id); // "i" indicates an integer
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        // Check if u_pro_img is not null
        if ($row['u_pro_img'] !== null) {
            // Return the u_pro_img as JSON
            echo json_encode(["u_pro_img" => $row['u_pro_img']], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        } else {
            // If u_pro_img is null, return a message
            echo json_encode(["message" => "No profile image found for the given user ID"]);
        }
    } else {
        // If no user is found, return an error
        echo json_encode(["error" => "No user found with the given ID"]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
