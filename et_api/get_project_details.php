<?php
// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$user_id = isset($data['user_id']) ? $data['user_id'] : null;
$project_id = isset($data['project_id']) ? $data['project_id'] : null;

if (!$user_id || !$project_id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing required parameters'
    ]);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get project info
    $project_query = "
        SELECT 
            p.assign_id as project_id,
            p.expense_type_id,
            'Project' as project_name,
            p.status,
            p.assigned_date as start_date,
            NULL as end_date
        FROM project_assignments p
        WHERE p.expense_type_id = :project_id
        AND p.status = 'active'
        LIMIT 1";

    $stmt = $pdo->prepare($project_query);
    $stmt->execute(['project_id' => $project_id]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Project not found'
        ]);
        exit;
    }

    // Assigned users
    $assigned_users_query = "
        SELECT 
            u.u_id as user_id,
            CONCAT(u.u_fname, ' ', COALESCE(u.u_mname, ''), ' ', u.u_lname) as full_name,
            u.u_email as email,
            u.u_mob as mobile,
            u.u_city as city,
            u.u_state as state,
            pa.role_id,
            CASE 
                WHEN pa.role_id = 1 THEN 'Project Manager'
                WHEN pa.role_id = 2 THEN 'Team Lead'
                WHEN pa.role_id = 3 THEN 'Supervisor'
                ELSE 'Team Member'
            END as role,
            pa.assigned_date,
            (SELECT CONCAT(u2.u_fname, ' ', u2.u_lname) 
             FROM user_details u2 
             WHERE u2.u_id = pa.assigned_by) as assigned_by
        FROM project_assignments pa
        JOIN user_details u ON pa.u_id = u.u_id
        WHERE pa.expense_type_id = :project_id 
        AND pa.status = 'active'";

    $stmt = $pdo->prepare($assigned_users_query);
    $stmt->execute(['project_id' => $project_id]);
    $assigned_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Team members
    $team_members_query = "
        SELECT DISTINCT
            u.u_id as user_id,
            CONCAT(u.u_fname, ' ', COALESCE(u.u_mname, ''), ' ', u.u_lname) as full_name,
            u.u_email as email,
            u.u_mob as mobile,
            CASE 
                WHEN pa.role_id = 1 THEN 'Project Manager'
                WHEN pa.role_id = 2 THEN 'Team Lead'
                WHEN pa.role_id = 3 THEN 'Supervisor'
                ELSE 'Team Member'
            END as role
        FROM user_details u
        LEFT JOIN project_assignments pa ON u.u_id = pa.u_id AND pa.expense_type_id = :project_id
        WHERE u.u_active = 1 
        AND u.u_is_del = 0
        AND (pa.expense_type_id = :project_id OR u.u_id IN (
            SELECT DISTINCT u_id FROM project_assignments WHERE expense_type_id = :project_id
        ))";

    $stmt = $pdo->prepare($team_members_query);
    $stmt->execute(['project_id' => $project_id]);
    $team_members = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Final result
    $project_details = array_merge($project, [
        'assigned_users' => $assigned_users,
        'team_members' => $team_members
    ]);

    echo json_encode([
        'status' => 'success',
        'project_details' => $project_details
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>