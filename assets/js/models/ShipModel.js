// assets/js/models/ShipModel.js
// Gestion des données des navires

import { ApiClient } from './ApiClient.js';
import { CONFIG } from '../config.js';

export class ShipModel {
    constructor() {
        this.api = new ApiClient();
        this.ships = [];
        this.lastUpdate = null;
    }

    /**
     * Récupère les navires dans une zone géographique
     * @param {number} minLat - Latitude minimale
     * @param {number} maxLat - Latitude maximale
     * @param {number} minLon - Longitude minimale
     * @param {number} maxLon - Longitude maximale
     * @param {string} token - Token EuRIS
     * @returns {Promise<Array>} Liste des navires
     */
    async fetchShips(minLat, maxLat, minLon, maxLon, token) {
        if (!token) {
            throw new Error(CONFIG.MESSAGES.ERROR_TOKEN);
        }

        try {
            const data = await this.api.getWithToken('/euris-proxy.php', token, {
                minLat,
                maxLat,
                minLon,
                maxLon,
                pageSize: CONFIG.EURIS.PAGE_SIZE
            });

            // L'API renvoie {tracks: [...], _metadata: {...}}
            const rawShips = data.tracks || data.data || (Array.isArray(data) ? data : []);

            // Normaliser les noms de propriétés pour le frontend
            this.ships = rawShips.map(ship => ({
                ...ship,
                // Mapping des propriétés
                lat: ship.latitude || ship.lat,
                lon: ship.longitude || ship.lon,
                sog: ship.speed !== undefined ? ship.speed : ship.sog,
                cog: ship.course !== undefined ? ship.course : ship.cog,
                fairwayName: ship.name || ship.shipName || ship.fairwayName
            }));

            this.lastUpdate = new Date();

            return this.ships;
        } catch (error) {
            console.error('Erreur fetchShips:', error);
            throw error;
        }
    }

    /**
     * Met à jour la liste des navires
     * @param {Array} newShips - Nouvelle liste de navires
     */
    updateShips(newShips) {
        this.ships = newShips;
        this.lastUpdate = new Date();
    }

    /**
     * Récupère un navire par son track_id
     * @param {string} trackId
     * @returns {Object|null}
     */
    getShipByTrackId(trackId) {
        return this.ships.find(ship => ship.trackId === trackId) || null;
    }

    /**
     * Retourne tous les navires
     * @returns {Array}
     */
    getAllShips() {
        return this.ships;
    }

    /**
     * Retourne le nombre de navires
     * @returns {number}
     */
    getShipCount() {
        return this.ships.length;
    }

    /**
     * Filtre les navires selon un critère
     * @param {Function} predicate - Fonction de filtrage
     * @returns {Array}
     */
    filterShips(predicate) {
        return this.ships.filter(predicate);
    }

    /**
     * Retourne la date de dernière mise à jour
     * @returns {Date|null}
     */
    getLastUpdate() {
        return this.lastUpdate;
    }

    /**
     * Vérifie si les données sont récentes (< 30s)
     * @returns {boolean}
     */
    isDataFresh() {
        if (!this.lastUpdate) return false;
        const now = new Date();
        const diff = now - this.lastUpdate;
        return diff < 30000; // 30 secondes
    }
}
