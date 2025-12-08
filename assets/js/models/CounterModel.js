// assets/js/models/CounterModel.js
// Gestion des données du compteur journalier

import { ApiClient } from './ApiClient.js';

export class CounterModel {
    constructor() {
        this.api = new ApiClient();
        this.currentDay = null;
        this.history = [];
    }

    /**
     * Récupère les données du jour actuel
     * @returns {Promise<Object>} Données du jour actuel
     */
    async fetchCurrentDay() {
        try {
            const data = await this.api.get('/compteur.php', { action: 'get_current' });
            this.currentDay = data;
            return this.currentDay;
        } catch (error) {
            console.error('Erreur fetchCurrentDay:', error);
            throw error;
        }
    }

    /**
     * Récupère l'historique complet des jours
     * @returns {Promise<Object>} Historique avec total cumulé
     */
    async fetchHistory() {
        try {
            const data = await this.api.get('/compteur.php', { action: 'get_history' });
            this.history = data.historique || [];
            return data;
        } catch (error) {
            console.error('Erreur fetchHistory:', error);
            throw error;
        }
    }

    /**
     * Incrémente le compteur pour un navire
     * @param {string} trackId - ID du navire
     * @param {string} shipName - Nom du navire
     * @returns {Promise<Object>} Résultat de l'incrémentation
     */
    async incrementCounter(trackId, shipName) {
        try {
            const data = await this.api.post('/compteur.php', {
                track_id: trackId,
                nom_navire: shipName
            }, { action: 'increment' });

            return data;
        } catch (error) {
            console.error('Erreur incrementCounter:', error);
            throw error;
        }
    }

    /**
     * Met à jour la liste des navires en zone rouge
     * @param {Array<string>} trackIds - Liste des track_id actuellement en zone rouge
     * @returns {Promise<Object>} Résultat de la mise à jour
     */
    async updateRedZone(trackIds) {
        try {
            const data = await this.api.post('/compteur.php', {
                trackIds: trackIds
            }, { action: 'update_zone_rouge' });

            return data;
        } catch (error) {
            console.error('Erreur updateRedZone:', error);
            throw error;
        }
    }

    /**
     * Supprime des jours de l'historique
     * @param {string} type - Type de suppression: 'plage', 'jour', 'tout'
     * @param {Object} params - Paramètres selon le type
     * @returns {Promise<Object>} Résultat de la suppression
     */
    async deleteDays(type, params = {}) {
        try {
            const body = { type, ...params };
            const data = await this.api.post('/compteur.php', body, { action: 'delete_days' });

            return data;
        } catch (error) {
            console.error('Erreur deleteDays:', error);
            throw error;
        }
    }

    /**
     * Retourne le numéro du jour actuel
     * @returns {number|null}
     */
    getCurrentDayNumber() {
        return this.currentDay ? this.currentDay.numero_jour : null;
    }

    /**
     * Retourne le compteur du jour actuel
     * @returns {number}
     */
    getCurrentCounter() {
        return this.currentDay ? this.currentDay.compteur_passages : 0;
    }

    /**
     * Retourne les track_ids en zone rouge
     * @returns {Array<string>}
     */
    getRedZoneShips() {
        return this.currentDay ? this.currentDay.bateaux_zone_rouge : [];
    }
}
