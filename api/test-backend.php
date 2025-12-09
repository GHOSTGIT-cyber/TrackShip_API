<?php
// Test simple du backend MVC
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== TEST BACKEND MVC ===\n\n";

// Test 1: Connexion BDD via config.php
echo "Test 1: Connexion MySQL via config.php...\n";
require_once __DIR__ . '/config.php';
try {
    $pdo = getDbConnection();
    echo "✅ Connexion MySQL OK\n\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Autoloader + Database class
echo "Test 2: Autoloader + Database class...\n";
require_once __DIR__ . '/index.php';
try {
    $db = Database::getInstance();
    $result = $db->fetchOne("SELECT 1 as test");
    if ($result['test'] == 1) {
        echo "✅ Database class OK\n\n";
    }
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 3: CounterModel
echo "Test 3: CounterModel...\n";
try {
    $counterModel = new CounterModel();
    $currentDay = $counterModel->getCurrentDay();

    if ($currentDay) {
        echo "✅ getCurrentDay() OK\n";
        echo "   Jour actuel: " . $currentDay['numero_jour'] . "\n";
        echo "   Date: " . $currentDay['date_jour'] . "\n";
        echo "   Compteur: " . $currentDay['compteur_passages'] . "\n";
    } else {
        echo "⚠️  Aucun jour actuel (base peut-être vide)\n";
    }

    $allDays = $counterModel->getAllDays();
    echo "   Historique: " . count($allDays) . " jour(s)\n\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 4: ShipModel
echo "Test 4: ShipModel...\n";
try {
    $shipModel = new ShipModel();

    if ($currentDay) {
        $shipsInRedZone = $shipModel->getShipsInRedZone($currentDay['numero_jour']);
        echo "✅ getShipsInRedZone() OK\n";
        echo "   Bateaux en zone rouge: " . count($shipsInRedZone) . "\n\n";
    }
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 5: CounterService
echo "Test 5: CounterService...\n";
try {
    $counterService = new CounterService();

    // Test ensureCurrentDayExists
    $counterService->ensureCurrentDayExists();
    echo "✅ ensureCurrentDayExists() OK\n";

    // Test getCurrentDayData
    $data = $counterService->getCurrentDayData();
    echo "✅ getCurrentDayData() OK\n";
    echo "   Jour: " . $data['numero_jour'] . "\n";
    echo "   Compteur: " . $data['compteur_passages'] . "\n";
    echo "   Bateaux en zone rouge: " . count($data['bateaux_zone_rouge']) . "\n\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 6: ValidationService
echo "Test 6: ValidationService...\n";
try {
    // Test bbox validation
    list($minLat, $maxLat, $minLon, $maxLon) = ValidationService::validateBboxParams(
        48.0, 49.0, 2.0, 3.0
    );
    echo "✅ validateBboxParams() OK\n";

    // Test track ID validation
    $trackId = ValidationService::validateTrackId("TEST123");
    echo "✅ validateTrackId() OK\n";

    // Test day number validation
    $dayNum = ValidationService::validateDayNumber(5);
    echo "✅ validateDayNumber() OK\n\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 7: CounterController (simulation)
echo "Test 7: CounterController...\n";
try {
    $controller = new CounterController();
    echo "✅ CounterController instancié OK\n\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 8: ProxyController (simulation)
echo "Test 8: ProxyController...\n";
try {
    $proxyController = new ProxyController();
    echo "✅ ProxyController instancié OK\n\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "===================\n";
echo "✅ TOUS LES TESTS PASSÉS !\n";
echo "===================\n";
echo "\nLe backend MVC fonctionne correctement.\n";
echo "Vous pouvez maintenant tester les routes API :\n";
echo "- Anciennes: http://localhost/TrackShip_API/api/compteur.php?action=get_current\n";
echo "- Nouvelles: http://localhost/TrackShip_API/api/index.php?action=get_current\n";
?>
