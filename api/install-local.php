<?php
// api/install-local.php
// Installation de la base de données locale pour XAMPP

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Installation Base de Données Locale (XAMPP)</h1>";
echo "<hr>";

// Connexion sans base de données (pour la créer)
try {
    $pdo = new PDO(
        'mysql:host=localhost;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    echo "<p style='color: green;'>✅ Connexion MySQL OK</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Erreur connexion: " . $e->getMessage() . "</p>";
    echo "<p><strong>Solution:</strong> Démarrer MySQL dans XAMPP Control Panel</p>";
    exit;
}

// Créer la base de données
echo "<h2>Création de la base de données...</h2>";
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS u411940699_Trackship CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p style='color: green;'>✅ Base de données créée: u411940699_Trackship</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Erreur création BDD: " . $e->getMessage() . "</p>";
}

// Se connecter à la base de données
$pdo->exec("USE u411940699_Trackship");

// Lire et exécuter le script SQL
echo "<h2>Création des tables...</h2>";
$sqlFile = __DIR__ . '/init-database.sql';

if (!file_exists($sqlFile)) {
    echo "<p style='color: red;'>❌ Fichier init-database.sql introuvable</p>";
    exit;
}

$sql = file_get_contents($sqlFile);

// Nettoyer le SQL (enlever les commentaires et lignes vides)
$lines = explode("\n", $sql);
$cleanedSql = '';
foreach ($lines as $line) {
    $line = trim($line);
    // Ignorer les commentaires et lignes vides
    if (empty($line) || strpos($line, '--') === 0) {
        continue;
    }
    $cleanedSql .= $line . ' ';
}

// Séparer les requêtes SQL (par point-virgule)
$statements = array_filter(
    array_map('trim', explode(';', $cleanedSql)),
    function($stmt) {
        return !empty($stmt) && stripos($stmt, 'SELECT') !== 0; // Ignorer les SELECT
    }
);

$success = 0;
$errors = 0;

foreach ($statements as $statement) {
    if (empty(trim($statement))) continue;

    try {
        $pdo->exec($statement);
        $success++;

        // Afficher quelle requête a été exécutée
        if (stripos($statement, 'CREATE TABLE') !== false) {
            preg_match('/CREATE TABLE.*?(\w+)\s*\(/i', $statement, $matches);
            if (isset($matches[1])) {
                echo "<p style='color: green;'>✅ Table créée: {$matches[1]}</p>";
            }
        } elseif (stripos($statement, 'INSERT') !== false) {
            echo "<p style='color: green;'>✅ Données insérées</p>";
        }
    } catch (PDOException $e) {
        echo "<p style='color: red;'>❌ Erreur: " . $e->getMessage() . "</p>";
        echo "<p style='color: gray;'>Requête: " . substr($statement, 0, 100) . "...</p>";
        $errors++;
    }
}

echo "<hr>";
echo "<p><strong>Résumé: $success requêtes réussies";
if ($errors > 0) {
    echo ", $errors erreurs";
}
echo "</strong></p>";

// Vérifier les tables créées
echo "<h2>Vérification des tables...</h2>";
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

echo "<ul>";
foreach ($tables as $table) {
    echo "<li style='color: green;'>✅ $table</li>";
}
echo "</ul>";

// Vérifier les données
echo "<h2>Vérification des données...</h2>";
try {
    $rows = $pdo->query("SELECT * FROM compteur_jours ORDER BY numero_jour")->fetchAll();

    if (count($rows) > 0) {
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>Numéro Jour</th><th>Date</th><th>Compteur</th></tr>";
        foreach ($rows as $row) {
            echo "<tr>";
            echo "<td>" . $row['numero_jour'] . "</td>";
            echo "<td>" . $row['date_jour'] . "</td>";
            echo "<td>" . $row['compteur_passages'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: orange;'>⚠️ Table compteur_jours vide (normal pour premier démarrage)</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Erreur: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h2>✅ Installation terminée !</h2>";
echo "<p>Vous pouvez maintenant tester:</p>";
echo "<ul>";
echo "<li><a href='test-backend.php'>test-backend.php</a></li>";
echo "<li><a href='compteur.php?action=get_current'>compteur.php?action=get_current</a></li>";
echo "<li><a href='index.php?action=get_current'>index.php?action=get_current (MVC)</a></li>";
echo "</ul>";
?>
