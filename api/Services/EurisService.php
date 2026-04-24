<?php
// api/Services/EurisService.php
// Communication et normalisation de données avec l'API EuRIS

require_once __DIR__ . '/../Models/ExternalApiModel.php';

class EurisService {
    private $apiModel;

    public function __construct() {
        $this->apiModel = new ExternalApiModel();
    }

    /**
     * Récupère et normalise les tracks depuis l'API EuRIS
     *
     * @param float $minLat
     * @param float $maxLat
     * @param float $minLon
     * @param float $maxLon
     * @param int $pageSize
     * @param string $token
     * @return array
     * @throws Exception
     */
    public function getTracksByBbox($minLat, $maxLat, $minLon, $maxLon, $pageSize, $token) {
        // Appel à l'API EuRIS
        $rawData = $this->apiModel->fetchTracksByBbox($minLat, $maxLat, $minLon, $maxLon, $pageSize, $token);

        // L'API retourne directement un tableau
        $tracks = is_array($rawData) ? $rawData : [];

        // Normalisation des tracks
        $normalizedTracks = $this->normalizeTracks($tracks);

        // Filtrage des tracks valides
        $validTracks = $this->filterValidTracks($normalizedTracks);

        // Réponse finale avec métadonnées
        return [
            'tracks' => $validTracks,
            '_metadata' => [
                'timestamp' => date('c'),
                'source' => 'EuRIS API via trackship.bakabi.fr',
                'trackCount' => count($validTracks),
                'totalReceived' => count($tracks),
                'validTracks' => count($validTracks)
            ]
        ];
    }

    /**
     * Normalise un tableau de tracks
     *
     * @param array $tracks
     * @return array
     */
    private function normalizeTracks($tracks) {
        return array_map([$this, 'normalizeTrack'], $tracks);
    }

    /**
     * Normalise un track individuel
     *
     * @param array $track
     * @return array
     */
    private function normalizeTrack($track) {
        // Extraction des coordonnées
        list($lat, $lon) = $this->extractCoordinates($track);

        // Utilisation de trackID comme identifiant principal
        $trackId = $track['trackID'] ?? null;

        // Extraction des données de mouvement
        $movement = $this->extractMovementData($track);

        // Dimensions
        $longueur = isset($track['inlen']) ? floatval($track['inlen']) : null;
        $largeur = isset($track['inbm']) ? floatval($track['inbm']) : null;

        // Position fluviale
        $positionISRS = $track['positionISRS'] ?? null;
        $positionName = $track['positionISRSName'] ?? null;

        // Statut (st: 1 = en mouvement, 2 = à l'arrêt)
        $statut = isset($track['st']) ? intval($track['st']) : null;

        return [
            // Identifiants
            'trackId' => $trackId,
            'mmsi' => $trackId, // On utilise trackID comme MMSI pour compatibilité frontend
            'name' => $track['name'] ?? "Track $trackId",
            'shipName' => $track['name'] ?? "Track $trackId",

            // Position
            'latitude' => $lat,
            'longitude' => $lon,
            'positionISRS' => $positionISRS,
            'positionName' => $positionName,

            // Mouvement
            'speed' => $movement['speed'],
            'course' => $movement['course'],
            'moving' => $movement['moving'],
            'status' => $statut,

            // Dimensions
            'length' => $longueur,
            'width' => $largeur,

            // Dimensions détaillées
            'dimA' => isset($track['dimA']) ? intval($track['dimA']) : null,
            'dimB' => isset($track['dimB']) ? intval($track['dimB']) : null,
            'dimC' => isset($track['dimC']) ? intval($track['dimC']) : null,
            'dimD' => isset($track['dimD']) ? intval($track['dimD']) : null,

            // Type de navire (non fourni par l'API)
            'shipType' => 'Navire fluvial',

            // Timestamp
            'timestamp' => $track['posTS'] ?? null,

            // Données originales pour debug
            '_original' => $track
        ];
    }

    /**
     * Extrait les coordonnées d'un track
     *
     * @param array $track
     * @return array [lat, lon]
     */
    private function extractCoordinates($track) {
        $lat = isset($track['lat']) ? floatval($track['lat']) : null;
        $lon = isset($track['lon']) ? floatval($track['lon']) : null;
        return [$lat, $lon];
    }

    /**
     * Extrait les données de mouvement d'un track
     *
     * @param array $track
     * @return array
     */
    private function extractMovementData($track) {
        // Vitesse (SOG = Speed Over Ground)
        $vitesse = isset($track['sog']) ? floatval($track['sog']) : null;

        // Cap (COG = Course Over Ground)
        $cap = isset($track['cog']) ? floatval($track['cog']) : null;

        // Statut de mouvement basé sur le champ "moving"
        $enMouvement = isset($track['moving']) ? $track['moving'] : null;

        return [
            'speed' => $vitesse,
            'course' => $cap,
            'moving' => $enMouvement
        ];
    }

    /**
     * Filtre les tracks valides (avec coordonnées et trackId)
     *
     * @param array $tracks
     * @return array
     */
    private function filterValidTracks($tracks) {
        $validTracks = array_filter($tracks, function($track) {
            return $track['latitude'] !== null &&
                   $track['longitude'] !== null &&
                   $track['trackId'] !== null;
        });

        // Réindexation du tableau
        return array_values($validTracks);
    }
}
?>
