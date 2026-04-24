<?php
// api/Services/AuthService.php
// Gestion de l'authentification et validation des tokens

class AuthService {

    /**
     * Valide la présence et le format du token Bearer
     *
     * @return string Token extrait
     * @throws Exception Si token manquant ou invalide
     */
    public static function validateBearerToken() {
        $token = self::extractTokenFromHeader();

        if (!$token) {
            throw new Exception('Authorization header required', 401);
        }

        // Validation basique du format du token (non vide)
        if (empty(trim($token))) {
            throw new Exception('Token invalide', 401);
        }

        return $token;
    }

    /**
     * Extrait le token du header Authorization
     *
     * @return string|null Token ou null si absent
     */
    public static function extractTokenFromHeader() {
        $headers = getallheaders();

        // Recherche du header Authorization
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];

            // Vérifier le format "Bearer TOKEN"
            if (strpos($authHeader, 'Bearer ') === 0) {
                return substr($authHeader, 7); // Extraire après "Bearer "
            }
        }

        return null;
    }

    /**
     * Vérifie si un token est valide (peut être étendu avec validation DB, JWT, etc.)
     * Pour l'instant, validation simple (non vide)
     *
     * @param string $token
     * @return bool
     */
    public static function isTokenValid($token) {
        // Validation basique: token non vide
        // TODO: Ajouter validation JWT, vérification DB, expiration, etc.
        return !empty(trim($token));
    }

    /**
     * Récupère les headers de la requête (compatible avec tous les serveurs)
     *
     * @return array
     */
    private static function getAllHeaders() {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }

        // Fallback pour serveurs qui n'ont pas getallheaders()
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}
?>
