<?php
// euris_proxy_alternative.php - Version compatible vieux PHP pour Free

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupérer les paramètres (compatible vieux PHP)
$minLat = isset($_GET['minLat']) ? $_GET['minLat'] : '';
$maxLat = isset($_GET['maxLat']) ? $_GET['maxLat'] : '';
$minLon = isset($_GET['minLon']) ? $_GET['minLon'] : '';
$maxLon = isset($_GET['maxLon']) ? $_GET['maxLon'] : '';
$pageSize = isset($_GET['pageSize']) ? $_GET['pageSize'] : 100;
$token = isset($_GET['token']) ? $_GET['token'] : '';

if (!$minLat || !$maxLat || !$minLon || !$maxLon || !$token) {
    http_response_code(400);
    echo json_encode(array('error' => 'Missing parameter'));
    exit;
}

// Construction de l'URL
$url = "https://www.eurisportal.eu/visuris/api/TracksV2/GetTracksByBBoxV2?" . 
    "minLat=" . $minLat . "&maxLat=" . $maxLat . "&minLon=" . $minLon . "&maxLon=" . $maxLon . "&pageSize=" . $pageSize;

// Test avec cURL d'abord
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Authorization: Bearer " . $token,
        "Accept: application/json",
        "User-Agent: Mozilla/5.0 (compatible; EuRIS-Proxy/1.0)"
    ));
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($response === false || $curl_error) {
        http_response_code(500);
        echo json_encode(array(
            'error' => 'cURL error',
            'curl_error' => $curl_error,
            'url' => $url
        ));
        exit;
    }
    
    // Vérifier si c'est du JSON valide
    $json_test = json_decode($response);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(502);
        echo json_encode(array(
            'error' => 'Invalid JSON response from API',
            'json_error' => json_last_error_msg(),
            'response_preview' => substr($response, 0, 200)
        ));
        exit;
    }
    
    http_response_code($httpcode);
    echo $response;
    
} elseif (ini_get('allow_url_fopen')) {
    // Fallback avec file_get_contents
    $context = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'header' => "Authorization: Bearer " . $token . "\r\n" .
                       "Accept: application/json\r\n" .
                       "User-Agent: Mozilla/5.0 (compatible; EuRIS-Proxy/1.0)\r\n",
            'timeout' => 30,
            'ignore_errors' => true
        )
    ));
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        http_response_code(502);
        echo json_encode(array(
            'error' => 'Unable to fetch data from EuRIS API',
            'method' => 'file_get_contents'
        ));
        exit;
    }
    
    // Vérifier si c'est du JSON valide
    $json_test = json_decode($response);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(502);
        echo json_encode(array(
            'error' => 'Invalid JSON response from API',
            'json_error' => json_last_error_msg(),
            'response_preview' => substr($response, 0, 200)
        ));
        exit;
    }
    
    echo $response;
    
} else {
    // Aucune méthode disponible
    http_response_code(500);
    echo json_encode(array(
        'error' => 'No HTTP client available',
        'curl_available' => function_exists('curl_init') ? 'yes' : 'no',
        'allow_url_fopen' => ini_get('allow_url_fopen') ? 'enabled' : 'disabled',
        'php_version' => phpversion(),
        'suggestion' => 'Free pages perso has limited PHP capabilities'
    ));
}
?>