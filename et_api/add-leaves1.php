<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
require_once 'config.php';

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // --- GET Request Handling ---
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch roles
        if (isset($_GET['fetch_roles']) && $_GET['fetch_roles'] === 'true') {
            $query = "SELECT role_id, role_name FROM user_role WHERE role_is_del = 0";
            $result = $conn->query($query);

            if (!$result)
                throw new Exception("Query failed: " . $conn->error);

            $roles = [];
            while ($row = $result->fetch_assoc()) {
                $roles[] = ['value' => $row['role_id'], 'label' => $row['role_name']];
            }

            echo json_encode(['status' => 'success', 'roles' => $roles]);
            exit;
        }

        // Fetch users by role
        if (isset($_GET['role_id'])) {
            $roleId = (int) $_GET['role_id'];
            $query = "SELECT ud.u_id, CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS name
                      FROM user_details ud
                      LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
                      WHERE ar.role_id = ? AND ud.u_is_del = 0";

            $stmt = $conn->prepare($query);
            if (!$stmt)
                throw new Exception("Prepare failed: " . $conn->error);

            $stmt->bind_param("i", $roleId);
            $stmt->execute();
            $result = $stmt->get_result();

            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = ['id' => $row['u_id'], 'name' => $row['name']];
            }

            echo json_encode(['status' => 'success', 'users' => $users]);
            exit;
        }
    }

    // --- POST Request Handling ---
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Log input data for debugging
        file_put_contents('debug.log', "POST Data: " . print_r($_POST, true) . "\n", FILE_APPEND);
        file_put_contents('debug.log', "FILES Data: " . print_r($_FILES, true) . "\n", FILE_APPEND);

        $conn->begin_transaction();

        try {
            // Validate required fields
            $requiredFields = [
                "leave_title",
                "leave_ground",
                "leave_from_date",
                "leave_to_date",
                "leave_comment",
                "leave_track_submitted_to",
                "leave_track_created_by"
            ];

            foreach ($requiredFields as $field) {
                if (empty($_POST[$field])) {
                    throw new Exception("Missing required field: $field");
                }
            }

            // Convert leave type to numeric value
            $leaveTypes = [
                "Casual Leave (CL)" => 0,
                "Medical Leave" => 1,
                "Half-day Leave" => 2
            ];

            if (!isset($leaveTypes[$_POST['leave_ground']])) {
                throw new Exception("Invalid leave type");
            }
            $leaveGround = $leaveTypes[$_POST['leave_ground']];

            // Insert leave details
            $stmt = $conn->prepare("
                INSERT INTO leave_track_details 
                (leave_title, leave_ground, leave_from_date, leave_to_date, 
                 leave_comment, leave_track_submitted_to, leave_track_created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->bind_param(
                "sissssi",
                $_POST['leave_title'],
                $leaveGround,
                $_POST['leave_from_date'],
                $_POST['leave_to_date'],
                $_POST['leave_comment'],
                $_POST['leave_track_submitted_to'],
                $_POST['leave_track_created_by']
            );

            if (!$stmt->execute()) {
                throw new Exception("Leave insert failed: " . $stmt->error);
            }

            $leaveId = $stmt->insert_id;
            $stmt->close();

            // Get the user ID for folder creation
            $userId = (int) $_POST['leave_track_created_by'];

            // Create user-specific directory if it doesn't exist
            $uploadDir = __DIR__ . "/upoads/leave_doc_photo/$userId/";
            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0777, true)) {
                    throw new Exception("Failed to create directory: $uploadDir");
                }
            }

            // Handle file uploads if any
            if (!empty($_FILES['file']['name'][0])) {
                $allowedTypes = ['pdf', 'jpg', 'jpeg', 'png'];
                $maxSize = 5 * 1024 * 1024; // 5MB

                foreach ($_FILES['file']['name'] as $index => $filename) {
                    $fileSize = $_FILES['file']['size'][$index];
                    $fileType = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                    $tmpName = $_FILES['file']['tmp_name'][$index];
                    $error = $_FILES['file']['error'][$index];

                    // Validate file
                    if ($error !== UPLOAD_ERR_OK) {
                        throw new Exception("File upload error: $error for file $filename");
                    }

                    if (!in_array($fileType, $allowedTypes)) {
                        throw new Exception("Invalid file type: .$fileType for file $filename");
                    }

                    if ($fileSize > $maxSize) {
                        throw new Exception("File too large: $filename (Max 5MB)");
                    }

                    // Generate safe filename
                    $cleanName = preg_replace("/[^a-zA-Z0-9_.-]/", "_", basename($filename));
                    $uniqueName = $leaveId . "_" . time() . "_" . $cleanName;
                    $targetPath = $uploadDir . $uniqueName;
                    $fileURL = "upoads/leave_doc_photo/$userId/" . $uniqueName; // Relative path for DB

                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $stmt = $conn->prepare("
                            INSERT INTO leave_track_documents 
                            (leave_id, doc_name, doc_file_url, doc_file_created_at)
                            VALUES (?, ?, ?, NOW())
                        ");
                        $stmt->bind_param("iss", $leaveId, $cleanName, $fileURL);

                        if (!$stmt->execute()) {
                            throw new Exception("Document insert failed: " . $stmt->error);
                        }
                        $stmt->close();
                    } else {
                        throw new Exception("Failed to move uploaded file: $filename");
                    }
                }
            }

            $conn->commit();
            echo json_encode([
                'status' => 'success',
                'message' => 'Leave request submitted successfully',
                'leave_id' => $leaveId
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    error_log("API Error: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred while processing your request',
        'debug' => (defined('ENVIRONMENT') && ENVIRONMENT === 'development') ? $e->getMessage() : null
    ]);
} finally {
    if (isset($stmt))
        $stmt->close();
    if (isset($conn))
        $conn->close();
}
?>