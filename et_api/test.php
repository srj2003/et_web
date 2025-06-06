<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'vendor/autoload.php';
echo "PhpSpreadsheet loaded.<br>";

require_once 'config.php';
echo "Config loaded.<br>";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("DB Error: " . $conn->connect_error);
}
echo "DB Connected.<br>";
?>

