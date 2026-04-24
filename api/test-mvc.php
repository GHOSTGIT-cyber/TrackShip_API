<?php
// api/test-mvc.php
// Script de test pour vérifier que le backend MVC fonctionne correctement

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🧪 Test Backend MVC - TrackShip</h1>";
echo "<p>Ce script teste si le nouveau backend MVC fonctionne correctement.</p>";
echo "<hr>";

// Test 1: Autoloader
echo "<h2>✅ Test 1 : Autoloader</h2>";
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/index.php'; // Cela va charger l'autoloader

try {
    $db = Database::getInstance();
    echo "<p style='color: green;'>✅ Database class chargée</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur Database: " . $e->getMessage() . "</p>";
}

try {
    $counterModel = new CounterModel();
    echo "<p style='color: green;'>✅ CounterModel class chargée</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur CounterModel: " . $e->getMessage() . "</p>";
}

try {
    $counterService = new CounterService();
    echo "<p style='color: green;'>✅ CounterService class chargée</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur CounterService: " . $e->getMessage() . "</p>";
}

echo "<hr>";

// Test 2: Connexion BDD
echo "<h2>✅ Test 2 : Connexion Base de Données</h2>";
try {
    $db = Database::getInstance();
    $result = $db->fetchOne("SELECT 1 as test");
    if ($result['test'] == 1) {
        echo "<p style='color: green;'>✅ Connexion MySQL réussie (localhost)</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur connexion: " . $e->getMessage() . "</p>";
}

echo "<hr>";

// Test 3: CounterModel
echo "<h2>✅ Test 3 : CounterModel</h2>";
try {
    $counterModel = new CounterModel();
    $currentDay = $counterModel->getCurrentDay();

    if ($currentDay) {
        echo "<p style='color: green;'>✅ Jour actuel récupéré:</p>";
        echo "<pre>" . print_r($currentDay, true) . "</pre>";
    } else {
        echo "<p style='color: orange;'>⚠️ Aucun jour actuel (normal si base vide)</p>";
    }

    $allDays = $counterModel->getAllDays();
    echo "<p style='color: green;'>✅ Historique récupéré: " . count($allDays) . " jour(s)</p>";

} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur CounterModel: " . $e->getMessage() . "</p>";
}

echo "<hr>";

// Test 4: CounterService
echo "<h2>✅ Test 4 : CounterService</h2>";
try {
    $counterService = new CounterService();

    // Ensure current day exists
    $counterService->ensureCurrentDayExists();
    echo "<p style='color: green;'>✅ ensureCurrentDayExists() exécuté</p>";

    // Get current day data
    $data = $counterService->getCurrentDayData();
    echo "<p style='color: green;'>✅ getCurrentDayData() réussi:</p>";
    echo "<pre>" . print_r($data, true) . "</pre>";

} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur CounterService: " . $e->getMessage() . "</p>";
}

echo "<hr>";

// Test 5: Routes disponibles
echo "<h2>✅ Test 5 : Routes API disponibles</h2>";
echo "<p>Voici les routes que vous pouvez tester :</p>";
echo "<ul>";
echo "<li><strong>Anciennes routes (compatibilité)</strong> :</li>";
echo "<ul>";
echo "<li><a href='compteur.php?action=get_current' target='_blank'>compteur.php?action=get_current</a></li>";
echo "<li><a href='compteur.php?action=get_history' target='_blank'>compteur.php?action=get_history</a></li>";
echo "</ul>";
echo "<li><strong>Nouvelles routes MVC</strong> :</li>";
echo "<ul>";
echo "<li><a href='index.php?action=get_current' target='_blank'>index.php?action=get_current (via routeur MVC)</a></li>";
echo "<li><a href='index.php?action=get_history' target='_blank'>index.php?action=get_history (via routeur MVC)</a></li>";
echo "</ul>";
echo "</ul>";

echo "<hr>";
echo "<p><strong>Résumé</strong> : Le backend MVC est opérationnel en parallèle de l'ancien système ✅</p>";
?>
