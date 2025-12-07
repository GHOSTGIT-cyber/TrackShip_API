<?php
// api/index.php
// Point d'entrée unique pour toutes les requêtes API (routeur MVC)

// Chargement de la configuration
require_once __DIR__ . '/config.php';

// Autoloader simple pour charger automatiquement les classes
spl_autoload_register(function($class) {
    $paths = [
        __DIR__ . '/Controllers/',
        __DIR__ . '/Models/',
        __DIR__ . '/Services/',
        __DIR__ . '/Utils/'
    ];

    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Si ce fichier est inclus depuis un autre script (comme test-mvc.php), ne pas exécuter le routeur
if (basename($_SERVER['SCRIPT_FILENAME']) !== 'index.php') {
    return;
}

// Gestion des headers CORS globalement
Response::setCorsHeaders();

// Gestion preflight CORS (OPTIONS)
Response::handlePreflight();

// Récupération de l'URI et de la méthode HTTP
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

try {
    // ==========================================
    // ROUTAGE
    // ==========================================

    // Route: /api/compteur.php ou /api/compteur
    if (strpos($requestUri, '/api/compteur') !== false) {
        $controller = new CounterController();
        $action = $_GET['action'] ?? null;

        switch ($action) {
            case 'get_current':
                $controller->getCurrentAction();
                break;

            case 'get_history':
                $controller->getHistoryAction();
                break;

            case 'increment':
                $controller->incrementAction();
                break;

            case 'update_zone_rouge':
                $controller->updateZoneRougeAction();
                break;

            case 'delete_days':
                $controller->deleteDaysAction();
                break;

            default:
                Response::error('Action invalide', 400);
        }
    }

    // Route: /api/euris-proxy.php ou /api/euris-proxy ou /api/proxy
    elseif (strpos($requestUri, '/api/euris-proxy') !== false || strpos($requestUri, '/api/proxy') !== false) {
        $controller = new ProxyController();
        $controller->getTracksAction();
    }

    // Route non trouvée
    else {
        Response::error('Route non trouvée', 404);
    }

} catch (Exception $e) {
    // Gestion globale des erreurs non catchées
    Response::error('Erreur serveur', 500, $e->getMessage());
}
?>
