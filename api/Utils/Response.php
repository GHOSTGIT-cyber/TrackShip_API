<?php
// api/Utils/Response.php
// Gestion centralisée des réponses JSON et headers CORS

class Response {

    /**
     * Envoie une réponse JSON avec code HTTP
     *
     * @param mixed $data Données à envoyer
     * @param int $httpCode Code HTTP
     * @return void
     */
    public static function json($data, $httpCode = 200) {
        self::setHttpCode($httpCode);
        self::setCorsHeaders();
        header('Content-Type: application/json');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        echo json_encode($data);
        exit;
    }

    /**
     * Envoie une réponse de succès
     *
     * @param mixed $data Données à envoyer
     * @param int $httpCode Code HTTP (par défaut 200)
     * @return void
     */
    public static function success($data, $httpCode = 200) {
        if (!is_array($data)) {
            $data = ['data' => $data];
        }

        $data['success'] = true;
        self::json($data, $httpCode);
    }

    /**
     * Envoie une réponse d'erreur
     *
     * @param string $message Message d'erreur
     * @param int $httpCode Code HTTP (par défaut 400)
     * @param mixed $details Détails supplémentaires (optionnel)
     * @return void
     */
    public static function error($message, $httpCode = 400, $details = null) {
        $response = [
            'error' => $message,
            'success' => false
        ];

        if ($details !== null) {
            $response['details'] = $details;
        }

        self::json($response, $httpCode);
    }

    /**
     * Définit le code de statut HTTP
     *
     * @param int $code
     * @return void
     */
    private static function setHttpCode($code) {
        http_response_code($code);
    }

    /**
     * Définit les headers CORS
     *
     * @return void
     */
    public static function setCorsHeaders() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    }

    /**
     * Gère les requêtes OPTIONS (preflight CORS)
     *
     * @return void
     */
    public static function handlePreflight() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            self::setCorsHeaders();
            http_response_code(200);
            exit;
        }
    }
}
?>
