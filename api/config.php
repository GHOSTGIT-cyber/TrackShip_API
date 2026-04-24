<?php
// api/config.php
// Configuration base de données (auto-détection environnement)

// Détection de l'environnement
$isLocal = (
    $_SERVER['SERVER_NAME'] === 'localhost' ||
    $_SERVER['SERVER_ADDR'] === '127.0.0.1' ||
    $_SERVER['SERVER_ADDR'] === '::1' ||
    strpos($_SERVER['HTTP_HOST'], 'localhost') !== false
);

// Configuration selon l'environnement
if ($isLocal) {
    // XAMPP Local
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'u411940699_Trackship');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_CHARSET', 'utf8mb4');
} else {
    // Coolify Production
    define('DB_HOST', 'trackship-db');
    define('DB_NAME', 'default');
    define('DB_USER', 'trackship');
    define('DB_PASS', 'NmCGVOGy9xO');
    define('DB_CHARSET', 'utf8mb4');
}

function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            exit(json_encode([
                'error' => 'Erreur de connexion à la base de données',
                'message' => $e->getMessage()
            ]));
        }
    }

    return $pdo;
}
?>
