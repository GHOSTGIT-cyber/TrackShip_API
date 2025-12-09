<?php
// api/Models/Database.php
// Classe de base pour toutes les interactions avec la base de données

class Database {
    private static $instance = null;
    private $pdo;

    /**
     * Constructeur privé (pattern Singleton)
     */
    private function __construct() {
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

            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            throw new Exception('Database connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Récupère l'instance unique de la base de données (Singleton)
     *
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Récupère l'objet PDO
     *
     * @return PDO
     */
    protected function getPdo() {
        return $this->pdo;
    }

    /**
     * Exécute une requête SQL et retourne le statement
     *
     * @param string $sql
     * @param array $params
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Récupère une seule ligne
     *
     * @param string $sql
     * @param array $params
     * @return array|false
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Récupère toutes les lignes
     *
     * @param string $sql
     * @param array $params
     * @return array
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Récupère une seule colonne (première colonne)
     *
     * @param string $sql
     * @param array $params
     * @return mixed
     */
    public function fetchColumn($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchColumn();
    }

    /**
     * Exécute une requête sans retour de données
     *
     * @param string $sql
     * @param array $params
     * @return int Nombre de lignes affectées
     */
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Récupère le dernier ID inséré
     *
     * @return string
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }

    /**
     * Démarre une transaction
     *
     * @return bool
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    /**
     * Valide une transaction
     *
     * @return bool
     */
    public function commit() {
        return $this->pdo->commit();
    }

    /**
     * Annule une transaction
     *
     * @return bool
     */
    public function rollback() {
        return $this->pdo->rollBack();
    }

    /**
     * Vérifie si une transaction est en cours
     *
     * @return bool
     */
    public function inTransaction() {
        return $this->pdo->inTransaction();
    }
}
?>
