<?php
// api/Services/ValidationService.php
// Validation et sanitization des entrées utilisateur

class ValidationService {

    /**
     * Valide les paramètres de bounding box
     *
     * @param mixed $minLat
     * @param mixed $maxLat
     * @param mixed $minLon
     * @param mixed $maxLon
     * @return array Valeurs validées [minLat, maxLat, minLon, maxLon]
     * @throws Exception Si validation échoue
     */
    public static function validateBboxParams($minLat, $maxLat, $minLon, $maxLon) {
        if ($minLat === null || $maxLat === null || $minLon === null || $maxLon === null) {
            throw new Exception('Paramètres manquants: minLat, maxLat, minLon, maxLon requis');
        }

        $minLat = self::sanitizeFloat($minLat);
        $maxLat = self::sanitizeFloat($maxLat);
        $minLon = self::sanitizeFloat($minLon);
        $maxLon = self::sanitizeFloat($maxLon);

        // Validation des limites géographiques
        if ($minLat < -90 || $minLat > 90 || $maxLat < -90 || $maxLat > 90) {
            throw new Exception('Latitude invalide (doit être entre -90 et 90)');
        }

        if ($minLon < -180 || $minLon > 180 || $maxLon < -180 || $maxLon > 180) {
            throw new Exception('Longitude invalide (doit être entre -180 et 180)');
        }

        if ($minLat >= $maxLat) {
            throw new Exception('minLat doit être inférieur à maxLat');
        }

        if ($minLon >= $maxLon) {
            throw new Exception('minLon doit être inférieur à maxLon');
        }

        return [$minLat, $maxLat, $minLon, $maxLon];
    }

    /**
     * Valide un paramètre action
     *
     * @param mixed $action
     * @param array $allowedActions Liste des actions autorisées
     * @return string Action validée
     * @throws Exception Si action invalide
     */
    public static function validateActionParam($action, $allowedActions) {
        if ($action === null) {
            throw new Exception('Paramètre action requis');
        }

        $action = self::sanitizeString($action);

        if (!in_array($action, $allowedActions, true)) {
            throw new Exception('Action invalide');
        }

        return $action;
    }

    /**
     * Valide un track ID
     *
     * @param mixed $trackId
     * @return string Track ID validé
     * @throws Exception Si trackId invalide
     */
    public static function validateTrackId($trackId) {
        if ($trackId === null || $trackId === '') {
            throw new Exception('trackId requis');
        }

        return self::sanitizeString($trackId);
    }

    /**
     * Valide un numéro de jour
     *
     * @param mixed $dayNumber
     * @return int Numéro de jour validé
     * @throws Exception Si numéro invalide
     */
    public static function validateDayNumber($dayNumber) {
        if ($dayNumber === null) {
            throw new Exception('Numéro de jour requis');
        }

        $dayNumber = self::sanitizeInt($dayNumber);

        if ($dayNumber < 1) {
            throw new Exception('Numéro de jour invalide (doit être >= 1)');
        }

        return $dayNumber;
    }

    /**
     * Valide et décode le corps JSON d'une requête
     *
     * @return array Données décodées
     * @throws Exception Si JSON invalide
     */
    public static function validateJsonBody() {
        $input = file_get_contents('php://input');

        if (empty($input)) {
            throw new Exception('Corps de requête vide');
        }

        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON invalide: ' . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Valide la présence de champs requis dans un tableau
     *
     * @param array $data
     * @param array $requiredFields
     * @throws Exception Si champs manquants
     */
    public static function validateRequiredFields($data, $requiredFields) {
        $missingFields = [];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                $missingFields[] = $field;
            }
        }

        if (!empty($missingFields)) {
            throw new Exception('Champs requis manquants: ' . implode(', ', $missingFields));
        }
    }

    /**
     * Valide un tableau de track IDs
     *
     * @param mixed $trackIds
     * @return array Track IDs validés
     * @throws Exception Si invalide
     */
    public static function validateTrackIdsArray($trackIds) {
        if (!is_array($trackIds)) {
            throw new Exception('trackIds doit être un tableau');
        }

        return array_map([self::class, 'sanitizeString'], $trackIds);
    }

    /**
     * Valide un page size
     *
     * @param mixed $pageSize
     * @param int $max Page size maximum
     * @return int Page size validé
     */
    public static function validatePageSize($pageSize, $max = 500) {
        $pageSize = self::sanitizeInt($pageSize);

        if ($pageSize < 1) {
            $pageSize = 100; // Valeur par défaut
        }

        if ($pageSize > $max) {
            $pageSize = $max;
        }

        return $pageSize;
    }

    // ==========================================
    // SANITIZATION
    // ==========================================

    /**
     * Sanitize une chaîne de caractères
     *
     * @param mixed $value
     * @return string
     */
    public static function sanitizeString($value) {
        return trim(strip_tags((string)$value));
    }

    /**
     * Sanitize un entier
     *
     * @param mixed $value
     * @return int
     */
    public static function sanitizeInt($value) {
        return (int)filter_var($value, FILTER_SANITIZE_NUMBER_INT);
    }

    /**
     * Sanitize un float
     *
     * @param mixed $value
     * @return float
     */
    public static function sanitizeFloat($value) {
        return (float)filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }

    /**
     * Sanitize un boolean
     *
     * @param mixed $value
     * @return bool
     */
    public static function sanitizeBool($value) {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
?>
