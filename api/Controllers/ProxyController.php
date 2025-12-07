<?php
// api/Controllers/ProxyController.php
// Contrôleur pour le proxy EuRIS API

require_once __DIR__ . '/../Services/EurisService.php';
require_once __DIR__ . '/../Services/AuthService.php';
require_once __DIR__ . '/../Services/ValidationService.php';
require_once __DIR__ . '/../Utils/Response.php';

class ProxyController {
    private $eurisService;

    public function __construct() {
        $this->eurisService = new EurisService();
    }

    /**
     * GET /api/proxy?minLat=...&maxLat=...&minLon=...&maxLon=...&pageSize=100
     * Récupère les tracks depuis l'API EuRIS
     */
    public function getTracksAction() {
        try {
            // 1. Validation du token
            $token = AuthService::validateBearerToken();

            // 2. Récupération et validation des paramètres
            $minLat = $_GET['minLat'] ?? null;
            $maxLat = $_GET['maxLat'] ?? null;
            $minLon = $_GET['minLon'] ?? null;
            $maxLon = $_GET['maxLon'] ?? null;
            $pageSize = $_GET['pageSize'] ?? 100;

            list($minLat, $maxLat, $minLon, $maxLon) = ValidationService::validateBboxParams(
                $minLat, $maxLat, $minLon, $maxLon
            );

            $pageSize = ValidationService::validatePageSize($pageSize);

            // 3. Appel au service EuRIS
            $result = $this->eurisService->getTracksByBbox(
                $minLat, $maxLat, $minLon, $maxLon, $pageSize, $token
            );

            // 4. Réponse
            Response::json($result);

        } catch (Exception $e) {
            $code = $e->getCode() ?: 400;
            if ($code === 401 || $code === 403) {
                Response::error($e->getMessage(), $code);
            } else {
                Response::error($e->getMessage(), $code >= 400 && $code < 600 ? $code : 500);
            }
        }
    }
}
?>
