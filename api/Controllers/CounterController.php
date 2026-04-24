<?php
// api/Controllers/CounterController.php
// Contrôleur pour les routes du compteur journalier

require_once __DIR__ . '/../Services/CounterService.php';
require_once __DIR__ . '/../Services/ValidationService.php';
require_once __DIR__ . '/../Utils/Response.php';

class CounterController {
    private $counterService;

    public function __construct() {
        $this->counterService = new CounterService();
    }

    /**
     * GET /api/compteur?action=get_current
     * Récupère le jour actuel et ses informations
     */
    public function getCurrentAction() {
        try {
            $data = $this->counterService->getCurrentDayData();
            Response::json($data);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/compteur?action=get_history
     * Récupère l'historique complet de tous les jours
     */
    public function getHistoryAction() {
        try {
            $data = $this->counterService->getHistoryData();
            Response::json($data);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/compteur?action=increment
     * Incrémente le compteur quand un bateau entre en zone rouge
     * Body: {trackId: "123456", shipName: "Le Bateau"}
     */
    public function incrementAction() {
        try {
            // Validation du corps JSON
            $input = ValidationService::validateJsonBody();

            // Validation des champs requis
            ValidationService::validateRequiredFields($input, ['trackId']);

            $trackId = ValidationService::validateTrackId($input['trackId']);
            $shipName = isset($input['shipName']) ? ValidationService::sanitizeString($input['shipName']) : "Track $trackId";

            // Incrémentation
            $result = $this->counterService->incrementCounterForShip($trackId, $shipName);

            Response::json($result);
        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * POST /api/compteur?action=update_zone_rouge
     * Met à jour la liste des bateaux actuellement en zone rouge
     * Body: {trackIds: ["123", "456", "789"]}
     */
    public function updateZoneRougeAction() {
        try {
            // Validation du corps JSON
            $input = ValidationService::validateJsonBody();

            // Validation des champs requis
            ValidationService::validateRequiredFields($input, ['trackIds']);

            $trackIds = ValidationService::validateTrackIdsArray($input['trackIds']);

            // Mise à jour
            $result = $this->counterService->updateRedZoneShips($trackIds);

            Response::json($result);
        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            Response::error($e->getMessage(), $code);
        }
    }

    /**
     * POST /api/compteur?action=delete_days
     * Efface des jours de l'historique
     * Body:
     *   - {type: "all"}
     *   - {type: "range", debut: 1, fin: 30}
     *   - {type: "single", jour: 15}
     */
    public function deleteDaysAction() {
        try {
            // Validation du corps JSON
            $input = ValidationService::validateJsonBody();

            // Validation des champs requis
            ValidationService::validateRequiredFields($input, ['type']);

            $type = ValidationService::sanitizeString($input['type']);

            // Validation du type
            $allowedTypes = ['all', 'range', 'single'];
            if (!in_array($type, $allowedTypes, true)) {
                throw new Exception('Type invalide (all, range, single)');
            }

            // Extraction et validation des paramètres selon le type
            $debut = null;
            $fin = null;
            $jour = null;

            if ($type === 'range') {
                ValidationService::validateRequiredFields($input, ['debut', 'fin']);
                $debut = ValidationService::validateDayNumber($input['debut']);
                $fin = ValidationService::validateDayNumber($input['fin']);
            } elseif ($type === 'single') {
                ValidationService::validateRequiredFields($input, ['jour']);
                $jour = ValidationService::validateDayNumber($input['jour']);
            }

            // Suppression
            $result = $this->counterService->deleteDays($type, $debut, $fin, $jour);

            Response::json($result);
        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
?>
