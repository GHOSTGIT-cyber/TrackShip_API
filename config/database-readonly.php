<?php
// config/database-readonly.php
// Configuration LECTURE SEULE pour le développement
// À utiliser si vous voulez que le dev affiche les données de prod sans pouvoir les modifier

// Détection automatique de l'environnement
$environment = getenv('APP_ENV') ?: 'production';

// Configuration selon environnement
if ($environment === 'development' || $environment === 'dev') {
    // DEV EN LECTURE SEULE SUR PROD
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'trackship_prod');  // MÊME BDD que production
    define('DB_USER', 'trackship_readonly'); // User avec SELECT only
    define('DB_PASS', 'MOT_DE_PASSE_READONLY_A_CONFIGURER');
    define('DEBUG_MODE', true);
    define('READ_ONLY_MODE', true); // Bloque les écritures
} elseif ($environment === 'local') {
    // Environnement local (XAMPP)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'trackship');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DEBUG_MODE', true);
    define('READ_ONLY_MODE', false);
} else {
    // Environnement production (trackship.bakabi.fr)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'trackship_prod');
    define('DB_USER', 'trackship_prod');
    define('DB_PASS', 'MOT_DE_PASSE_PROD_A_CONFIGURER');
    define('DEBUG_MODE', false);
    define('READ_ONLY_MODE', false);
}

define('DB_CHARSET', 'utf8mb4');

/**
 * Crée une connexion PDO à la base de données
 * @return PDO
 */
function getDatabase() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);

            if (DEBUG_MODE) {
                error_log(sprintf(
                    "Connexion BDD établie: %s@%s/%s (env: %s, readonly: %s)",
                    DB_USER,
                    DB_HOST,
                    DB_NAME,
                    getenv('APP_ENV') ?: 'production',
                    READ_ONLY_MODE ? 'OUI' : 'NON'
                ));
            }
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                error_log("Erreur connexion BDD: " . $e->getMessage());
                die(json_encode([
                    'error' => 'Erreur de connexion à la base de données',
                    'details' => $e->getMessage()
                ]));
            } else {
                die(json_encode([
                    'error' => 'Erreur de connexion à la base de données'
                ]));
            }
        }
    }

    return $pdo;
}

/**
 * Vérifie si une opération d'écriture est autorisée
 * @param string $action - L'action demandée
 * @return bool
 */
function isWriteAllowed($action = '') {
    if (!defined('READ_ONLY_MODE') || READ_ONLY_MODE !== true) {
        return true;
    }

    // Actions d'écriture bloquées en mode readonly
    $writeActions = [
        'update_zone_rouge',
        'increment',
        'delete_day',
        'reset_counter'
    ];

    if (in_array($action, $writeActions)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Mode lecture seule',
            'message' => 'Les modifications sont désactivées en environnement de développement',
            'action_blocked' => $action
        ]);
        exit;
    }

    return true;
}

// Commandes SQL pour créer le user readonly sur Hostinger:
/*
CREATE USER 'trackship_readonly'@'localhost' IDENTIFIED BY 'VOTRE_PASSWORD_FORT';
GRANT SELECT ON trackship_prod.* TO 'trackship_readonly'@'localhost';
FLUSH PRIVILEGES;
*/
?>
