<?php
// api/Models/ShipModel.php
// Gestion des tables bateaux_vus et bateaux_zone_rouge_actifs

require_once __DIR__ . '/Database.php';

class ShipModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    // ========================================
    // BATEAUX VUS (historique permanent)
    // ========================================

    /**
     * Ajoute un bateau dans l'historique des bateaux vus
     * Utilise INSERT IGNORE pour éviter les doublons
     *
     * @param int $numeroJour
     * @param string $trackId
     * @return bool Succès de l'insertion
     */
    public function addShipSeen($numeroJour, $trackId) {
        $sql = "
            INSERT IGNORE INTO bateaux_vus (numero_jour, track_id)
            VALUES (?, ?)
        ";
        return $this->db->execute($sql, [$numeroJour, $trackId]) > 0;
    }

    /**
     * Récupère tous les bateaux vus pour un jour
     *
     * @param int $numeroJour
     * @return array
     */
    public function getShipsSeen($numeroJour) {
        $sql = "
            SELECT id, track_id, premiere_detection
            FROM bateaux_vus
            WHERE numero_jour = ?
            ORDER BY premiere_detection ASC
        ";
        return $this->db->fetchAll($sql, [$numeroJour]);
    }

    /**
     * Compte le nombre de bateaux vus pour un jour
     *
     * @param int $numeroJour
     * @return int
     */
    public function countShipsSeen($numeroJour) {
        $sql = "
            SELECT COUNT(*) as count
            FROM bateaux_vus
            WHERE numero_jour = ?
        ";
        $result = $this->db->fetchOne($sql, [$numeroJour]);
        return (int)$result['count'];
    }

    // ========================================
    // BATEAUX EN ZONE ROUGE (état actuel)
    // ========================================

    /**
     * Ajoute un bateau dans la zone rouge active
     *
     * @param int $numeroJour
     * @param string $trackId
     * @return bool Succès de l'insertion
     */
    public function addShipInRedZone($numeroJour, $trackId) {
        $sql = "
            INSERT INTO bateaux_zone_rouge_actifs (numero_jour, track_id)
            VALUES (?, ?)
        ";
        return $this->db->execute($sql, [$numeroJour, $trackId]) > 0;
    }

    /**
     * Retire un bateau de la zone rouge active
     *
     * @param int $numeroJour
     * @param string $trackId
     * @return int Nombre de lignes supprimées
     */
    public function removeShipFromRedZone($numeroJour, $trackId) {
        $sql = "
            DELETE FROM bateaux_zone_rouge_actifs
            WHERE numero_jour = ? AND track_id = ?
        ";
        return $this->db->execute($sql, [$numeroJour, $trackId]);
    }

    /**
     * Récupère tous les track_id des bateaux en zone rouge pour un jour
     *
     * @param int $numeroJour
     * @return array Tableau de track_id
     */
    public function getShipsInRedZone($numeroJour) {
        $sql = "
            SELECT track_id
            FROM bateaux_zone_rouge_actifs
            WHERE numero_jour = ?
            ORDER BY entree_zone ASC
        ";
        $results = $this->db->fetchAll($sql, [$numeroJour]);
        return array_column($results, 'track_id');
    }

    /**
     * Vérifie si un bateau est actuellement en zone rouge
     *
     * @param int $numeroJour
     * @param string $trackId
     * @return bool
     */
    public function isShipInRedZone($numeroJour, $trackId) {
        $sql = "
            SELECT COUNT(*) as count
            FROM bateaux_zone_rouge_actifs
            WHERE numero_jour = ? AND track_id = ?
        ";
        $result = $this->db->fetchOne($sql, [$numeroJour, $trackId]);
        return $result['count'] > 0;
    }

    /**
     * Supprime les bateaux en zone rouge d'un jour spécifique
     * (utilisé lors du changement de jour)
     *
     * @param int $numeroJour
     * @return int Nombre de lignes supprimées
     */
    public function clearRedZoneForDay($numeroJour) {
        $sql = "
            DELETE FROM bateaux_zone_rouge_actifs
            WHERE numero_jour = ?
        ";
        return $this->db->execute($sql, [$numeroJour]);
    }

    /**
     * Nettoie les bateaux en zone rouge des jours précédents
     *
     * @param int $beforeDayNumber Supprimer tous les jours < $beforeDayNumber
     * @return int Nombre de lignes supprimées
     */
    public function clearOldRedZoneShips($beforeDayNumber) {
        $sql = "
            DELETE FROM bateaux_zone_rouge_actifs
            WHERE numero_jour < ?
        ";
        return $this->db->execute($sql, [$beforeDayNumber]);
    }

    /**
     * Supprime les bateaux qui ne sont plus en zone rouge
     * (ceux qui ne sont pas dans la liste fournie)
     *
     * @param int $numeroJour
     * @param array $activeTrackIds Liste des track_id actuellement en zone rouge
     * @return int Nombre de lignes supprimées
     */
    public function removeShipsNotInList($numeroJour, $activeTrackIds) {
        if (empty($activeTrackIds)) {
            // Si la liste est vide, supprimer tous les bateaux de ce jour
            return $this->clearRedZoneForDay($numeroJour);
        }

        $placeholders = implode(',', array_fill(0, count($activeTrackIds), '?'));
        $sql = "
            DELETE FROM bateaux_zone_rouge_actifs
            WHERE numero_jour = ? AND track_id NOT IN ($placeholders)
        ";

        $params = array_merge([$numeroJour], $activeTrackIds);
        return $this->db->execute($sql, $params);
    }

    // ========================================
    // NETTOYAGE GÉNÉRAL
    // ========================================

    /**
     * Nettoie les données anciennes (bateaux vus avant une certaine date)
     *
     * @param string $beforeDate Date au format YYYY-MM-DD
     * @return int Nombre de lignes supprimées
     */
    public function cleanupOldData($beforeDate) {
        $sql = "
            DELETE bv FROM bateaux_vus bv
            INNER JOIN compteur_jours cj ON bv.numero_jour = cj.numero_jour
            WHERE cj.date_jour < ?
        ";
        return $this->db->execute($sql, [$beforeDate]);
    }

    /**
     * Compte le total de bateaux en zone rouge actuellement
     *
     * @return int
     */
    public function countTotalActiveRedZoneShips() {
        $sql = "SELECT COUNT(*) as count FROM bateaux_zone_rouge_actifs";
        $result = $this->db->fetchOne($sql);
        return (int)$result['count'];
    }
}
?>
