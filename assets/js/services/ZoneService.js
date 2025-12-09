// assets/js/services/ZoneService.js
// Gestion des zones géographiques et calculs de distances

import { CONFIG } from '../config.js';

export class ZoneService {
    /**
     * Calcule la distance entre deux points GPS (formule Haversine)
     * @param {number} lat1 - Latitude point 1
     * @param {number} lon1 - Longitude point 1
     * @param {number} lat2 - Latitude point 2
     * @param {number} lon2 - Longitude point 2
     * @returns {number} Distance en mètres
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Rayon de la Terre en mètres

        const toRad = (deg) => deg * (Math.PI / 180);

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance en mètres
    }

    /**
     * Détermine le statut d'une zone selon la distance
     * @param {number} distance - Distance en mètres
     * @returns {string} 'alerte', 'attention', 'surveillance', 'hors_zone'
     */
    static getZoneStatus(distance) {
        if (distance <= CONFIG.ZONES.ZONE_ROUGE) {
            return 'alerte';
        } else if (distance <= CONFIG.ZONES.ZONE_ORANGE) {
            return 'attention';
        } else if (distance <= CONFIG.ZONES.ZONE_VERTE) {
            return 'surveillance';
        } else {
            return 'hors_zone';
        }
    }

    /**
     * Vérifie si un point est dans un polygone (Ray Casting Algorithm)
     * @param {number} lat - Latitude du point
     * @param {number} lon - Longitude du point
     * @param {Array<Array<number>>} polygon - Polygone [[lat, lon], ...]
     * @returns {boolean} true si le point est dans le polygone
     */
    static isInPolygon(lat, lon, polygon) {
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][1]; // lon
            const yi = polygon[i][0]; // lat
            const xj = polygon[j][1];
            const yj = polygon[j][0];

            const intersect = ((yi > lat) !== (yj > lat)) &&
                (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Vérifie si un point est sur l'eau (Seine Paris)
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {boolean}
     */
    static isOnWater(lat, lon) {
        return this.isInPolygon(lat, lon, CONFIG.POLYGONE_SEINE_PARIS);
    }

    /**
     * Calcule un bounding box autour d'un point central
     * @param {number} centerLat - Latitude du centre
     * @param {number} centerLon - Longitude du centre
     * @param {number} marginDegrees - Marge en degrés (défaut: CONFIG.EURIS.BBOX_MARGIN)
     * @returns {Object} { minLat, maxLat, minLon, maxLon }
     */
    static calculateBoundingBox(centerLat, centerLon, marginDegrees = CONFIG.EURIS.BBOX_MARGIN) {
        return {
            minLat: centerLat - marginDegrees,
            maxLat: centerLat + marginDegrees,
            minLon: centerLon - marginDegrees,
            maxLon: centerLon + marginDegrees
        };
    }

    /**
     * Retourne la couleur du marqueur selon le statut
     * @param {string} status - Statut de la zone
     * @returns {string} Code couleur hexadécimal
     */
    static getMarkerColor(status) {
        return CONFIG.MARKER_COLORS[status] || CONFIG.MARKER_COLORS.hors_zone;
    }

    /**
     * Retourne le libellé d'une zone selon la distance
     * @param {number} distance - Distance en mètres
     * @returns {string} Libellé de la zone
     */
    static getZoneLabel(distance) {
        const km = (distance / 1000).toFixed(2);

        if (distance <= CONFIG.ZONES.ZONE_ROUGE) {
            return `🔴 Zone Rouge (${km} km)`;
        } else if (distance <= CONFIG.ZONES.ZONE_ORANGE) {
            return `🟠 Zone Orange (${km} km)`;
        } else if (distance <= CONFIG.ZONES.ZONE_VERTE) {
            return `🟢 Zone Verte (${km} km)`;
        } else {
            return `⚪ Hors Zone (${km} km)`;
        }
    }
}
