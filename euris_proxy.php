<?php
// euris_proxy.php

// Récupérer les paramètres GET
$minLat = $_GET['minLat'] ?? '';
$maxLat = $_GET['maxLat'] ?? '';
$minLon = $_GET['minLon'] ?? '';
$maxLon = $_GET['maxLon'] ?? '';
$pageSize = $_GET['pageSize'] ?? 100;
$token = $_GET['token'] ?? '';

if (!$minLat || !$maxLat || !$minLon || !$maxLon || !$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameter']);
    exit;
}

$url = "https://www.eurisportal.eu/visuris/api/TracksV2/GetTracksByBBoxV2?".
    "minLat={$minLat}&maxLat={$maxLat}&minLon={$minLon}&maxLon={$maxLon}&pageSize={$pageSize}";

// Préparer la requête cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token",
    "Accept: application/json"
]);

// Exécuter la requête
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Répondre au front
http_response_code($httpcode);
header('Content-Type: application/json');
echo $response;
?>