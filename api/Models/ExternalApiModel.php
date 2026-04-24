<?php
// api/Models/ExternalApiModel.php
// Communication avec l'API externe EuRIS

class ExternalApiModel {
    private $baseUrl = 'https://www.eurisportal.eu/visuris/api/TracksV2';

    /**
     * Récupère les tracks depuis l'API EuRIS par bounding box
     *
     * @param float $minLat
     * @param float $maxLat
     * @param float $minLon
     * @param float $maxLon
     * @param int $pageSize
     * @param string $token Token d'authentification Bearer
     * @return array Données brutes de l'API
     * @throws Exception En cas d'erreur API
     */
    public function fetchTracksByBbox($minLat, $maxLat, $minLon, $maxLon, $pageSize, $token) {
        $url = sprintf(
            '%s/GetTracksByBBoxV2?minLat=%.6f&maxLat=%.6f&minLon=%.6f&maxLon=%.6f&pageSize=%d',
            $this->baseUrl,
            $minLat,
            $maxLat,
            $minLon,
            $maxLon,
            $pageSize
        );

        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
            'User-Agent: TrackShip/1.0 (trackship.bakabi.fr)'
        ];

        return $this->executeCurl($url, $headers);
    }

    /**
     * Exécute une requête cURL
     *
     * @param string $url
     * @param array $headers
     * @return array Réponse décodée de l'API
     * @throws Exception En cas d'erreur
     */
    private function executeCurl($url, $headers) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => $headers
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Gestion des erreurs cURL
        if ($error) {
            throw new Exception('Erreur de connexion à l\'API EuRIS: ' . $error);
        }

        // Gestion des codes HTTP d'erreur
        if ($httpCode !== 200) {
            $this->handleApiError($httpCode);
        }

        // Validation et décodage JSON
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Réponse invalide de l\'API EuRIS: ' . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Gère les erreurs HTTP de l'API
     *
     * @param int $httpCode
     * @throws Exception
     */
    private function handleApiError($httpCode) {
        $errorMessages = [
            401 => 'Token d\'authentification invalide ou expiré',
            403 => 'Accès interdit - permissions insuffisantes',
            404 => 'Service EuRIS non trouvé',
            429 => 'Trop de requêtes - attendez avant de réessayer',
            500 => 'Service EuRIS temporairement indisponible',
            502 => 'Service EuRIS temporairement indisponible (Bad Gateway)',
            503 => 'Service EuRIS en maintenance',
            504 => 'Délai d\'attente dépassé (Gateway Timeout)'
        ];

        $message = $errorMessages[$httpCode] ?? 'Erreur API EuRIS';
        throw new Exception($message, $httpCode);
    }
}
?>
