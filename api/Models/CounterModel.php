<?php
// api/Models/CounterModel.php
// Gestion de la table compteur_jours

require_once __DIR__ . '/Database.php';

class CounterModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Récupère le jour actuel (basé sur CURDATE())
     *
     * @return array|false
     */
    public function getCurrentDay() {
        $sql = "
            SELECT numero_jour, date_jour, compteur_passages
            FROM compteur_jours
            WHERE date_jour = CURDATE()
            LIMIT 1
        ";
        return $this->db->fetchOne($sql);
    }

    /**
     * Crée un nouveau jour
     *
     * @param int $numeroJour
     * @param string $dateJour (format YYYY-MM-DD ou NULL pour CURDATE())
     * @return int ID inséré
     */
    public function createDay($numeroJour, $dateJour = null) {
        if ($dateJour === null) {
            $sql = "
                INSERT INTO compteur_jours (numero_jour, date_jour, compteur_passages)
                VALUES (?, CURDATE(), 0)
            ";
            $this->db->execute($sql, [$numeroJour]);
        } else {
            $sql = "
                INSERT INTO compteur_jours (numero_jour, date_jour, compteur_passages)
                VALUES (?, ?, 0)
            ";
            $this->db->execute($sql, [$numeroJour, $dateJour]);
        }
        return $this->db->lastInsertId();
    }

    /**
     * Récupère le numéro du dernier jour enregistré
     *
     * @return int
     */
    public function getLastDayNumber() {
        $sql = "
            SELECT COALESCE(MAX(numero_jour), 0) as dernier_numero
            FROM compteur_jours
        ";
        $result = $this->db->fetchOne($sql);
        return (int)$result['dernier_numero'];
    }

    /**
     * Incrémente le compteur d'un jour
     *
     * @param int $numeroJour
     * @return int Nombre de lignes affectées
     */
    public function incrementCounter($numeroJour) {
        $sql = "
            UPDATE compteur_jours
            SET compteur_passages = compteur_passages + 1
            WHERE numero_jour = ?
        ";
        return $this->db->execute($sql, [$numeroJour]);
    }

    /**
     * Récupère la valeur du compteur d'un jour
     *
     * @param int $numeroJour
     * @return int
     */
    public function getCounterValue($numeroJour) {
        $sql = "
            SELECT compteur_passages
            FROM compteur_jours
            WHERE numero_jour = ?
        ";
        return (int)$this->db->fetchColumn($sql, [$numeroJour]);
    }

    /**
     * Récupère tous les jours par ordre chronologique
     *
     * @return array
     */
    public function getAllDays() {
        $sql = "
            SELECT numero_jour, date_jour, compteur_passages
            FROM compteur_jours
            ORDER BY numero_jour ASC
        ";
        return $this->db->fetchAll($sql);
    }

    /**
     * Calcule le total cumulé de tous les passages
     *
     * @return int
     */
    public function getTotalCounter() {
        $sql = "
            SELECT COALESCE(SUM(compteur_passages), 0) as total
            FROM compteur_jours
        ";
        $result = $this->db->fetchOne($sql);
        return (int)$result['total'];
    }

    /**
     * Supprime un jour spécifique
     *
     * @param int $numeroJour
     * @return int Nombre de lignes supprimées
     */
    public function deleteDay($numeroJour) {
        $sql = "DELETE FROM compteur_jours WHERE numero_jour = ?";
        return $this->db->execute($sql, [$numeroJour]);
    }

    /**
     * Supprime une plage de jours
     *
     * @param int $debut
     * @param int $fin
     * @return int Nombre de lignes supprimées
     */
    public function deleteDayRange($debut, $fin) {
        $sql = "
            DELETE FROM compteur_jours
            WHERE numero_jour >= ? AND numero_jour <= ?
        ";
        return $this->db->execute($sql, [$debut, $fin]);
    }

    /**
     * Supprime tous les jours sauf le jour actuel
     *
     * @param int $exceptCurrentDay Numéro du jour actuel à conserver
     * @return int Nombre de lignes supprimées
     */
    public function deleteAllDays($exceptCurrentDay) {
        $sql = "
            DELETE FROM compteur_jours
            WHERE numero_jour < ?
        ";
        return $this->db->execute($sql, [$exceptCurrentDay]);
    }

    /**
     * Vérifie si un jour existe
     *
     * @param int $numeroJour
     * @return bool
     */
    public function dayExists($numeroJour) {
        $sql = "
            SELECT COUNT(*) as count
            FROM compteur_jours
            WHERE numero_jour = ?
        ";
        $result = $this->db->fetchOne($sql, [$numeroJour]);
        return $result['count'] > 0;
    }
}
?>
