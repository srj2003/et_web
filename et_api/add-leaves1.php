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

// Include config and token verifier
require_once 'config.php';
require_once 'auth.php';

try {
    // PDO connection
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
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

    // --- GET Request Handling ---
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch roles
        if (isset($_GET['fetch_roles']) && $_GET['fetch_roles'] === 'true') {
            $stmt = $pdo->query("SELECT role_id, role_name FROM user_role WHERE role_is_del = 0");
            $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $formattedRoles = array_map(function ($role) {
                return ['value' => $role['role_id'], 'label' => $role['role_name']];
            }, $roles);

            echo json_encode(['status' => 'success', 'roles' => $formattedRoles]);
            exit;
        }

        // Fetch users by role
        if (isset($_GET['role_id'])) {
            $roleId = (int) $_GET['role_id'];
            $query = "SELECT ud.u_id, CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS name
FROM user_details ud
LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
WHERE ar.role_id = ? AND ud.u_is_del = 0";

            $stmt = $pdo->prepare($query);
            $stmt->execute([$roleId]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $formattedUsers = array_map(function ($user) {
                return ['id' => $user['u_id'], 'name' => $user['name']];
            }, $users);

            echo json_encode(['status' => 'success', 'users' => $formattedUsers]);
            exit;
        }
    }

    // --- POST Request Handling ---
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Log input data for debugging
        file_put_contents('debug.log', "POST Data: " . print_r($_POST, true) . "\n", FILE_APPEND);
        file_put_contents('debug.log', "FILES Data: " . print_r($_FILES, true) . "\n", FILE_APPEND);

        $pdo->beginTransaction();

        try {
            // Validate required fields
            $requiredFields = [
                "leave_title",
                "leave_ground",
                "leave_from_date",
                "leave_to_date",
                "leave_comment",
                "leave_track_submitted_to"
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
            $stmt = $pdo->prepare("
INSERT INTO leave_track_details
(leave_title, leave_ground, leave_from_date, leave_to_date,
leave_comment, leave_track_submitted_to, leave_track_created_by)
VALUES (?, ?, ?, ?, ?, ?, ?)
");

            $stmt->execute([
                $_POST['leave_title'],
                $leaveGround,
                $_POST['leave_from_date'],
                $_POST['leave_to_date'],
                $_POST['leave_comment'],
                $_POST['leave_track_submitted_to'],
                $user_id // Use authenticated user's ID
            ]);

            $leaveId = $pdo->lastInsertId();

            // Create user-specific directory if it doesn't exist
            $uploadDir = __DIR__ . "/upoads/leave_doc_photo/$user_id/";
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
                    $fileURL = "upoads/leave_doc_photo/$user_id/" . $uniqueName; // Relative path for DB

                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $stmt = $pdo->prepare("
INSERT INTO leave_track_documents
(leave_id, doc_name, doc_file_url, doc_file_created_at)
VALUES (?, ?, ?, NOW())
");
                        $stmt->execute([$leaveId, $cleanName, $fileURL]);
                    } else {
                        throw new Exception("Failed to move uploaded file: $filename");
                    }
                }
            }

            $pdo->commit();
            echo json_encode([
                'status' => 'success',
                'message' => 'Leave request submitted successfully',
                'leave_id' => $leaveId
            ]);

        } catch (Exception $e) {
            $pdo->rollBack();
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
}