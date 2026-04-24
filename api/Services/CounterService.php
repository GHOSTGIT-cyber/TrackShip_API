<?php
// api/Services/CounterService.php
// Logique métier du compteur journalier

require_once __DIR__ . '/../Models/CounterModel.php';
require_once __DIR__ . '/../Models/ShipModel.php';

class CounterService {
    private $counterModel;
    private $shipModel;

    public function __construct() {
        $this->counterModel = new CounterModel();
        $this->shipModel = new ShipModel();
    }

    /**
     * S'assure que le jour actuel existe dans la base de données
     * Si minuit est passé, crée automatiquement un nouveau jour et nettoie les bateaux actifs
     *
     * @return void
     */
    public function ensureCurrentDayExists() {
        $currentDay = $this->counterModel->getCurrentDay();

        if (!$currentDay) {
            // Le jour actuel n'existe pas : créer un nouveau jour
            $lastDayNumber = $this->counterModel->getLastDayNumber();
            $newDayNumber = $lastDayNumber + 1;

            // Transaction pour garantir la cohérence
            $db = Database::getInstance();
            $db->beginTransaction();

            try {
                // Créer le nouveau jour
                $this->counterModel->createDay($newDayNumber);

                // Nettoyer les bateaux actifs des jours précédents
                $this->shipModel->clearOldRedZoneShips($newDayNumber);

                $db->commit();
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
        }
    }

    /**
     * Récupère les données du jour actuel
     *
     * @return array
     */
    public function getCurrentDayData() {
        $this->ensureCurrentDayExists();

        $currentDay = $this->counterModel->getCurrentDay();
        if (!$currentDay) {
            throw new Exception('Impossible de récupérer le jour actuel');
        }

        $shipsInRedZone = $this->shipModel->getShipsInRedZone($currentDay['numero_jour']);

        return [
            'success' => true,
            'numero_jour' => (int)$currentDay['numero_jour'],
            'date_jour' => $currentDay['date_jour'],
            'compteur_passages' => (int)$currentDay['compteur_passages'],
            'bateaux_zone_rouge' => $shipsInRedZone
        ];
    }

    /**
     * Récupère l'historique complet de tous les jours
     *
     * @return array
     */
    public function getHistoryData() {
        $allDays = $this->counterModel->getAllDays();
        $totalCounter = $this->counterModel->getTotalCounter();

        return [
            'success' => true,
            'historique' => $allDays,
            'total_cumule' => $totalCounter
        ];
    }

    /**
     * Incrémente le compteur quand un bateau entre en zone rouge
     *
     * @param string $trackId
     * @param string $shipName
     * @return array
     * @throws Exception
     */
    public function incrementCounterForShip($trackId, $shipName) {
        $this->ensureCurrentDayExists();

        $currentDay = $this->counterModel->getCurrentDay();
        if (!$currentDay) {
            throw new Exception('Impossible de récupérer le jour actuel');
        }

        $numeroJour = $currentDay['numero_jour'];

        // Vérifier si le bateau est déjà en zone rouge ACTUELLEMENT
        if ($this->shipModel->isShipInRedZone($numeroJour, $trackId)) {
            return [
                'success' => true,
                'already_counted' => true,
                'numero_jour' => $numeroJour,
                'compteur' => (int)$currentDay['compteur_passages'],
                'message' => 'Bateau déjà en zone rouge'
            ];
        }

        // NOUVELLE ENTRÉE : Incrémenter le compteur
        $db = Database::getInstance();
        $db->beginTransaction();

        try {
            // 1. Incrémenter le compteur
            $this->counterModel->incrementCounter($numeroJour);

            // 2. Ajouter dans la table des bateaux en zone rouge actifs
            $this->shipModel->addShipInRedZone($numeroJour, $trackId);

            // 3. Ajouter dans l'historique des bateaux vus (si pas déjà vu ce jour)
            $this->shipModel->addShipSeen($numeroJour, $trackId);

            // 4. Récupérer le nouveau compteur
            $newCounter = $this->counterModel->getCounterValue($numeroJour);

            $db->commit();

            return [
                'success' => true,
                'numero_jour' => $numeroJour,
                'compteur' => $newCounter,
                'track_id' => $trackId,
                'ship_name' => $shipName,
                'message' => 'Compteur incrémenté'
            ];
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
    }

    /**
     * Met à jour la liste des bateaux actuellement en zone rouge
     *
     * @param array $activeTrackIds Liste des track_id actuellement en zone rouge
     * @return array
     * @throws Exception
     */
    public function updateRedZoneShips($activeTrackIds) {
        $this->ensureCurrentDayExists();

        $currentDay = $this->counterModel->getCurrentDay();
        if (!$currentDay) {
            throw new Exception('Impossible de récupérer le jour actuel');
        }

        $numeroJour = $currentDay['numero_jour'];

        // Récupérer les bateaux actuellement enregistrés en zone rouge
        $currentShips = $this->shipModel->getShipsInRedZone($numeroJour);

        // Déterminer les bateaux à supprimer (sortis de zone)
        $shipsToRemove = array_diff($currentShips, $activeTrackIds);

        // Supprimer les bateaux qui ne sont plus en zone
        if (count($shipsToRemove) > 0) {
            $this->shipModel->removeShipsNotInList($numeroJour, $activeTrackIds);
        }

        return [
            'success' => true,
            'numero_jour' => $numeroJour,
            'bateaux_actifs' => $activeTrackIds,
            'bateaux_supprimes' => array_values($shipsToRemove)
        ];
    }

    /**
     * Efface des jours de l'historique
     *
     * @param string $type Type d'effacement: 'range', 'single', 'all'
     * @param int|null $debut Jour de début (pour 'range')
     * @param int|null $fin Jour de fin (pour 'range')
     * @param int|null $jour Jour unique (pour 'single')
     * @return array
     * @throws Exception
     */
    public function deleteDays($type, $debut = null, $fin = null, $jour = null) {
        // Récupérer le jour actuel pour éviter de le supprimer
        $currentDay = $this->counterModel->getCurrentDay();
        $currentDayNumber = $currentDay ? $currentDay['numero_jour'] : 9999;

        $db = Database::getInstance();
        $db->beginTransaction();

        try {
            $message = '';

            switch ($type) {
                case 'all':
                    // Supprimer TOUS les jours sauf le jour actuel
                    $this->counterModel->deleteAllDays($currentDayNumber);
                    $message = 'Tout l\'historique a été effacé';
                    break;

                case 'range':
                    if ($debut === null || $fin === null) {
                        throw new Exception('debut et fin requis pour type=range');
                    }

                    if ($debut >= $currentDayNumber || $fin >= $currentDayNumber) {
                        throw new Exception('Impossible de supprimer le jour actuel ou futur');
                    }

                    $this->counterModel->deleteDayRange($debut, $fin);
                    $message = "Jours $debut à $fin effacés";
                    break;

                case 'single':
                    if ($jour === null) {
                        throw new Exception('jour requis pour type=single');
                    }

                    if ($jour >= $currentDayNumber) {
                        throw new Exception('Impossible de supprimer le jour actuel ou futur');
                    }

                    $this->counterModel->deleteDay($jour);
                    $message = "Jour $jour effacé";
                    break;

                default:
                    throw new Exception('Type invalide (range, single, all)');
            }

            $db->commit();

            return [
                'success' => true,
                'message' => $message
            ];
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
    }
}
?>
