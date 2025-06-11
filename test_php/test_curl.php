<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h2>Test des fonctionnalités PHP sur Free</h2>";

echo "<h3>Version PHP :</h3>";
echo phpversion();

echo "<h3>Extensions disponibles :</h3>";
$extensions = get_loaded_extensions();
sort($extensions);
foreach($extensions as $ext) {
    echo "- " . $ext . "<br>";
}

echo "<h3>Test cURL :</h3>";
if (function_exists('curl_init')) {
    echo "✅ cURL est disponible<br>";
    
    // Test simple
    $ch = curl_init('https://httpbin.org/get');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $result = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($result) {
        echo "✅ Test cURL réussi<br>";
    } else {
        echo "❌ Erreur cURL: " . $error . "<br>";
    }
} else {
    echo "❌ cURL n'est pas disponible<br>";
}

echo "<h3>Test file_get_contents avec URL :</h3>";
if (ini_get('allow_url_fopen')) {
    echo "✅ allow_url_fopen est activé<br>";
    
    $context = stream_context_create(array(
        'http' => array(
            'timeout' => 10,
            'user_agent' => 'Mozilla/5.0 Test'
        )
    ));
    
    $test = @file_get_contents('https://httpbin.org/get', false, $context);
    if ($test) {
        echo "✅ file_get_contents fonctionne avec les URLs<br>";
    } else {
        echo "❌ file_get_contents ne fonctionne pas avec les URLs<br>";
    }
} else {
    echo "❌ allow_url_fopen est désactivé<br>";
}

echo "<h3>Fonctions désactivées :</h3>";
$disabled = ini_get('disable_functions');
if ($disabled) {
    echo "Fonctions désactivées: " . $disabled . "<br>";
} else {
    echo "Aucune fonction désactivée détectée<br>";
}
?>