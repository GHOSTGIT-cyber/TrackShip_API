// assets/js/controllers/ShipController.js
// Contrôle des navires

import { ShipModel } from '../models/ShipModel.js';
import { ShipAnalysisService } from '../services/ShipAnalysisService.js';
import { CONFIG } from '../config.js';
import { Logger } from '../utils/Logger.js';

export class ShipController {
    constructor() {
        this.model = new ShipModel();
        this.analysisResults = new Map(); // trackId => analysis
    }

    /**
     * Récupère les navires dans une zone
     * @param {Object} bbox - { minLat, maxLat, minLon, maxLon }
     * @param {string} token - Token EuRIS
     * @returns {Promise<Array>}
     */
    async fetchShips(bbox, token) {
        try {
            console.log('🔍 BBOX:', bbox);
            console.log('🔑 TOKEN:', token ? token.substring(0, 20) + '...' : 'MANQUANT');

            const ships = await this.model.fetchShips(
                bbox.minLat,
                bbox.maxLat,
                bbox.minLon,
                bbox.maxLon,
                token
            );

            Logger.info(`${ships.length} navire(s) récupéré(s)`);
            console.log('📡 DONNÉES BRUTES API:', ships);
            return ships;
        } catch (error) {
            Logger.error('Erreur récupération navires:', error);
            throw error;
        }
    }

    /**
     * Analyse tous les navires
     * @param {Array} ships
     * @param {Object} baseCoords
     * @returns {Map} trackId => analysis
     */
    analyzeShips(ships, baseCoords) {
        this.analysisResults.clear();

        ships.forEach(ship => {
            const analysis = ShipAnalysisService.analyzeShip(ship, baseCoords);
            this.analysisResults.set(ship.trackId, analysis);
        });

        return this.analysisResults;
    }

    /**
     * Retourne les résultats d'analyse
     * @returns {Map}
     */
    getAnalysisResults() {
        return this.analysisResults;
    }

    /**
     * Retourne tous les navires
     * @returns {Array}
     */
    getAllShips() {
        return this.model.getAllShips();
    }

    /**
     * Calcule les statistiques
     * @returns {Object}
     */
    getStats() {
        return ShipAnalysisService.calculateStats(
            this.model.getAllShips(),
            this.analysisResults
        );
    }
}
