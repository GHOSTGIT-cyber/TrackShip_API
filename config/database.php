<?php
// config/database.php
// Configuration base de données multi-environnement

// Détection automatique de l'environnement
$environment = getenv('APP_ENV') ?: 'production';

// Configuration selon environnement
if ($environment === 'development' || $environment === 'dev') {
    // Environnement développement (devtrackship.bakabi.fr)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u411940699_devtrackship');
    define('DB_USER', 'u411940699_ghostdev');
    define('DB_PASS', '$t1B97ydK');
    define('DEBUG_MODE', true);
} elseif ($environment === 'local') {
    // Environnement local (XAMPP)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'trackship');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DEBUG_MODE', true);
} else {
    // Environnement production (trackship.bakabi.fr)
    // TODO: Créer la BDD production sur Hostinger
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u411940699_trackship'); // À vérifier
    define('DB_USER', 'u411940699_trackprod'); // À créer
    define('DB_PASS', 'MOT_DE_PASSE_PROD_A_CONFIGURER');
    define('DEBUG_MODE', false);
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
                    "Connexion BDD établie: %s@%s/%s (env: %s)",
                    DB_USER,
                    DB_HOST,
                    DB_NAME,
                    getenv('APP_ENV') ?: 'production'
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
?>
