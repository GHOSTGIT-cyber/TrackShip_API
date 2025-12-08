// assets/js/config.js
// Configuration globale de l'application TrackShip

export const CONFIG = {
    // URL de base de l'API
    API_BASE_URL: '/TrackShip_API/api',

    // Coordonnées de la base (Boulogne-Billancourt - CORRECTES)
    BASE_COORDS: {
        lat: 48.853229,
        lon: 2.225328
    },

    // Définition des zones de surveillance (en mètres) - CORRECTES
    ZONES: {
        ZONE_ALERTE: 1000,      // ≤ 1km - Zone alerte (rouge)
        ZONE_VIGILANCE: 2000,   // 1-2km - Zone vigilance (orange)
        ZONE_APPROCHE: 3000     // 2-3km - Zone d'approche (vert)
    },

    // Intervalles de rafraîchissement (en millisecondes)
    REFRESH: {
        NORMAL: 10000,       // 10s - Mode normal
        ALERTE: 2000         // 2s - Mode alerte (navire en zone rouge)
    },

    // Configuration de la carte Leaflet
    MAP: {
        DEFAULT_ZOOM: 11,
        MIN_ZOOM: 8,
        MAX_ZOOM: 18,
        TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },

    // Polygone de la Seine à Paris (pour détection eau/terre)
    POLYGONE_SEINE_PARIS: [
        [48.8566, 2.3522],
        [48.8606, 2.3376],
        [48.8629, 2.3298],
        [48.8652, 2.3220],
        [48.8675, 2.3142],
        [48.8698, 2.3064],
        [48.8721, 2.2986],
        [48.8744, 2.2908],
        [48.8767, 2.2830],
        [48.8790, 2.2752],
        [48.8813, 2.2674],
        [48.8836, 2.2596],
        [48.8859, 2.2518],
        [48.8882, 2.2440],
        [48.8905, 2.2362],
        [48.8928, 2.2284],
        [48.8951, 2.2206],
        [48.8974, 2.2128],
        [48.8997, 2.2050],
        [48.9020, 2.1972],
        [48.9043, 2.1894],
        [48.9066, 2.1816],
        [48.9089, 2.1738],
        [48.9112, 2.1660],
        [48.9135, 2.1582],
        [48.9158, 2.1504],
        [48.9181, 2.1426],
        [48.9204, 2.1348],
        [48.9227, 2.1270]
    ],

    // Configuration RGPD (numérotation anonyme)
    GDPR: {
        DUREE_RETENTION_NUMEROTATION: 24 * 60 * 60 * 1000,  // 24h en millisecondes
        PREFIX_NUMERO: 'N',                                  // Préfixe pour les numéros (ex: N1, N2, etc.)
        STORAGE_KEY_SHIPS: 'navires_numerotes',
        STORAGE_KEY_NEXT_NUMBER: 'prochain_numero',
        STORAGE_KEY_LAST_RESET: 'derniere_reinit'
    },

    // Configuration API EuRIS
    EURIS: {
        PAGE_SIZE: 100,                          // Nombre max de navires par requête
        BBOX_MARGIN: 0.5,                        // Marge autour de la zone (en degrés)
        TOKEN_STORAGE_KEY: 'euris_token'
    },

    // Seuils de validation des navires
    VALIDATION: {
        MIN_SPEED: 0.1,                          // Vitesse minimale pour considérer un navire en mouvement (en nœuds)
        MIN_HISTORY_LENGTH: 3,                   // Nombre min de positions pour valider un mouvement
        MAX_LAND_DISTANCE: 100,                  // Distance max d'un point d'eau pour être considéré sur l'eau (en mètres)
        LAND_EMITTER_KEYWORDS: ['STATION', 'BASE', 'PORT', 'QUAI', 'TERRE']  // Mots-clés identifiant émetteurs terrestres
    },

    // Couleurs des marqueurs ET des cercles selon le statut - CORRECTES
    MARKER_COLORS: {
        alerte: '#dc3545',           // Rouge - Zone alerte (≤1km)
        vigilance: '#ff8800',        // Orange - Zone vigilance (1-2km)
        approche: '#28a745',         // Vert - Zone d'approche (2-3km)
        hors_zone: '#808080',        // Gris - Hors zone (>3km)
        non_conforme: '#ffc107',     // Jaune - Non conforme
        base: '#0000FF'              // Bleu - Base de surveillance
    },

    // Configuration du logo de la base
    BASE_ICON: {
        url: 'assets/1.png',         // Logo Foil in Paris
        size: [40, 40],
        anchor: [20, 20],
        popupAnchor: [0, -20]
    },

    // Messages d'erreur
    MESSAGES: {
        ERROR_API: 'Erreur lors de la communication avec l\'API',
        ERROR_TOKEN: 'Token EuRIS manquant ou invalide',
        ERROR_GEOLOCATION: 'Impossible de récupérer la position',
        SUCCESS_INCREMENT: 'Compteur incrémenté avec succès',
        SUCCESS_DELETE: 'Données effacées avec succès'
    }
};
