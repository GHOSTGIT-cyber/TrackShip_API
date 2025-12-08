// assets/js/controllers/CounterController.js
// Contrôle du compteur journalier

import { CounterModel } from '../models/CounterModel.js';
import { Logger } from '../utils/Logger.js';
import { NotificationService } from '../services/NotificationService.js';

export class CounterController {
    constructor() {
        this.model = new CounterModel();
        this.redZoneShips = new Set(); // Track IDs actuellement en zone rouge
    }

    /**
     * Initialise le compteur
     * @returns {Promise<void>}
     */
    async init() {
        try {
            const data = await this.model.fetchCurrentDay();
            this.redZoneShips = new Set(data.bateaux_zone_rouge);
            Logger.success(`Compteur initialisé: Jour ${data.numero_jour}, ${data.compteur_passages} passages`);
        } catch (error) {
            Logger.error('Erreur initialisation compteur:', error);
            NotificationService.error('Impossible de charger le compteur');
        }
    }

    /**
     * Gère les entrées/sorties de la zone rouge
     * @param {Array} ships - Liste des navires
     * @param {Map} analysisResults - Résultats d'analyse
     * @returns {Promise<void>}
     */
    async handleRedZoneEntry(ships, analysisResults) {
        const currentRedZone = [];
        const newEntries = [];

        // Identifier les navires actuellement en zone rouge
        ships.forEach(ship => {
            const analysis = analysisResults.get(ship.trackId);

            if (analysis && analysis.status === 'alerte' && analysis.distance <= 1000) {
                currentRedZone.push(ship.trackId);

                // Nouvelle entrée détectée
                if (!this.redZoneShips.has(ship.trackId)) {
                    newEntries.push({
                        trackId: ship.trackId,
                        shipName: ship.name || ship.trackId
                    });
                }
            }
        });

        // Incrémenter le compteur pour chaque nouvelle entrée
        for (const entry of newEntries) {
            try {
                await this.model.incrementCounter(entry.trackId, entry.shipName);
                Logger.success(`Compteur incrémenté pour ${entry.trackId}`);
            } catch (error) {
                Logger.error(`Erreur incrémentation pour ${entry.trackId}:`, error);
            }
        }

        // Mettre à jour la liste active en zone rouge
        try {
            await this.model.updateRedZone(currentRedZone);
            this.redZoneShips = new Set(currentRedZone);
        } catch (error) {
            Logger.error('Erreur mise à jour zone rouge:', error);
        }
    }

    /**
     * Récupère et retourne l'historique complet
     * @returns {Promise<Object>}
     */
    async getHistory() {
        try {
            return await this.model.fetchHistory();
        } catch (error) {
            Logger.error('Erreur récupération historique:', error);
            NotificationService.error('Impossible de charger l\'historique');
            return { historique: [], total_cumule: 0 };
        }
    }

    /**
     * Supprime des jours de l'historique
     * @param {string} type - 'plage', 'jour', 'tout'
     * @param {Object} params - Paramètres de suppression
     * @returns {Promise<boolean>}
     */
    async deleteDays(type, params = {}) {
        try {
            await this.model.deleteDays(type, params);
            Logger.success('Données supprimées avec succès');
            NotificationService.success(CONFIG.MESSAGES.SUCCESS_DELETE);
            return true;
        } catch (error) {
            Logger.error('Erreur suppression:', error);
            NotificationService.error('Erreur lors de la suppression');
            return false;
        }
    }

    /**
     * Ouvre le dialogue de suppression
     * @returns {Promise<void>}
     */
    async openDeleteDialog() {
        const currentDay = this.model.getCurrentDayNumber();
        if (!currentDay) {
            NotificationService.error('Aucun jour actuel trouvé');
            return;
        }

        const message = `🗑️ Effacer l'historique des passages\n\n` +
            `Entrez la période à effacer :\n\n` +
            `Format : "1-30" (du jour 1 au jour 30)\n` +
            `ou "50" (uniquement le jour 50)\n` +
            `ou "tout" (effacer TOUT l'historique)\n\n` +
            `Jours disponibles : 1 à ${currentDay - 1}`;

        const response = NotificationService.prompt(message);
        if (!response) return;

        // Parser la réponse
        const trimmed = response.trim().toLowerCase();

        if (trimmed === 'tout') {
            // Confirmation supplémentaire pour "tout"
            if (!NotificationService.confirm('⚠️ Êtes-vous sûr de vouloir effacer TOUT l\'historique ?')) {
                return;
            }
            await this.deleteDays('tout');
        } else if (trimmed.includes('-')) {
            // Plage de jours
            const [debut, fin] = trimmed.split('-').map(n => parseInt(n.trim()));

            if (isNaN(debut) || isNaN(fin) || debut < 1 || fin >= currentDay || debut > fin) {
                NotificationService.error('Plage invalide');
                return;
            }

            await this.deleteDays('plage', { debut, fin });
        } else {
            // Jour unique
            const jour = parseInt(trimmed);

            if (isNaN(jour) || jour < 1 || jour >= currentDay) {
                NotificationService.error('Numéro de jour invalide');
                return;
            }

            await this.deleteDays('jour', { jour });
        }

        // Rafraîchir l'affichage après suppression
        await this.init();
    }

    /**
     * Retourne le nombre de passages du jour actuel
     * @returns {number}
     */
    getCurrentCounter() {
        return this.model.getCurrentCounter();
    }

    /**
     * Retourne le numéro du jour actuel
     * @returns {number|null}
     */
    getCurrentDayNumber() {
        return this.model.getCurrentDayNumber();
    }
}
