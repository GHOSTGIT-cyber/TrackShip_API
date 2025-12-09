<?php
// api/install-local-v2.php
// Installation simplifiée de la base de données locale

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Installation Base de Données Locale (XAMPP) - V2</h1>";
echo "<hr>";

// Connexion sans base de données
try {
    $pdo = new PDO(
        'mysql:host=localhost;charset=utf8mb4',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<p style='color: green;'>✅ Connexion MySQL OK</p>";
} catch (PDOException $e) {
    die("<p style='color: red;'>❌ Erreur: " . $e->getMessage() . "</p>");
}

// Créer la base de données
echo "<h2>Création de la base de données...</h2>";
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS u411940699_Trackship CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE u411940699_Trackship");
    echo "<p style='color: green;'>✅ Base de données: u411940699_Trackship</p>";
} catch (PDOException $e) {
    die("<p style='color: red;'>❌ Erreur: " . $e->getMessage() . "</p>");
}

echo "<h2>Création des tables...</h2>";

// Table 1: compteur_jours
try {
    $sql = "CREATE TABLE IF NOT EXISTS compteur_jours (
        numero_jour INT PRIMARY KEY AUTO_INCREMENT,
        date_jour DATE NOT NULL UNIQUE,
        compteur_passages INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date_jour)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "<p style='color: green;'>✅ Table: compteur_jours</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ compteur_jours: " . $e->getMessage() . "</p>";
}

// Table 2: bateaux_vus
try {
    $sql = "CREATE TABLE IF NOT EXISTS bateaux_vus (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero_jour INT NOT NULL,
        track_id VARCHAR(50) NOT NULL,
        premiere_detection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (numero_jour) REFERENCES compteur_jours(numero_jour) ON DELETE CASCADE,
        UNIQUE KEY unique_track_par_jour (numero_jour, track_id),
        INDEX idx_track (track_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "<p style='color: green;'>✅ Table: bateaux_vus</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ bateaux_vus: " . $e->getMessage() . "</p>";
}

// Table 3: bateaux_zone_rouge_actifs
try {
    $sql = "CREATE TABLE IF NOT EXISTS bateaux_zone_rouge_actifs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero_jour INT NOT NULL,
        track_id VARCHAR(50) NOT NULL,
        entree_zone TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        derniere_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (numero_jour) REFERENCES compteur_jours(numero_jour) ON DELETE CASCADE,
        UNIQUE KEY unique_track_actif (numero_jour, track_id),
        INDEX idx_track_actif (track_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "<p style='color: green;'>✅ Table: bateaux_zone_rouge_actifs</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ bateaux_zone_rouge_actifs: " . $e->getMessage() . "</p>";
}

echo "<h2>Insertion des données initiales...</h2>";

try {
    $sql = "INSERT INTO compteur_jours (numero_jour, date_jour, compteur_passages)
            VALUES
                (1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 8),
                (2, CURDATE(), 6)
            ON DUPLICATE KEY UPDATE compteur_passages = VALUES(compteur_passages)";

    $pdo->exec($sql);
    echo "<p style='color: green;'>✅ Données insérées: Jour 1 (8 passages), Jour 2 (6 passages)</p>";
} catch (PDOException $e) {
    echo "<p style='color: orange;'>⚠️ Données: " . $e->getMessage() . " (peut-être déjà présentes)</p>";
}

echo "<h2>Vérification...</h2>";

// Vérifier les tables
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "<p><strong>Tables créées (" . count($tables) . "):</strong></p><ul>";
foreach ($tables as $table) {
    echo "<li style='color: green;'>✅ $table</li>";
}
echo "</ul>";

// Vérifier les données
try {
    $rows = $pdo->query("SELECT * FROM compteur_jours ORDER BY numero_jour")->fetchAll();

    if (count($rows) > 0) {
        echo "<p><strong>Données dans compteur_jours:</strong></p>";
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr style='background: #eee;'><th>Jour</th><th>Date</th><th>Passages</th></tr>";
        foreach ($rows as $row) {
            echo "<tr>";
            echo "<td>" . $row['numero_jour'] . "</td>";
            echo "<td>" . $row['date_jour'] . "</td>";
            echo "<td><strong>" . $row['compteur_passages'] . "</strong></td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Erreur lecture: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h2 style='color: green;'>✅ Installation terminée !</h2>";
echo "<p><strong>Prochaines étapes:</strong></p>";
echo "<ul>";
echo "<li><a href='test-backend.php' target='_blank'>1. Tester le backend MVC</a></li>";
echo "<li><a href='compteur.php?action=get_current' target='_blank'>2. Tester ancienne route (compteur.php)</a></li>";
echo "<li><a href='index.php?action=get_current' target='_blank'>3. Tester nouvelle route MVC (index.php)</a></li>";
echo "</ul>";
?>
