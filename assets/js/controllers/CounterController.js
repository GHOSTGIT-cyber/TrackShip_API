// assets/js/controllers/CounterController.js
// Contrôle du compteur journalier

import { CounterModel } from '../models/CounterModel.js';
import { Logger } from '../utils/Logger.js';
import { NotificationService } from '../services/NotificationService.js';
import { DateFormatter } from '../utils/DateFormatter.js';

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
            const dateFormatee = DateFormatter.formatShort(data.date_jour);
            Logger.success(`Compteur initialisé: ${dateFormatee}, ${data.compteur_passages} passages`);
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
        try {
            // Récupérer l'historique pour afficher les dates disponibles
            const historyData = await this.model.fetchHistory();
            const historique = historyData.historique;

            if (historique.length === 0 || historique.length === 1) {
                NotificationService.alert('ℹ️ Aucun historique à effacer (seul le jour actuel existe)');
                return;
            }

            // Créer la liste des dates disponibles (sans le jour actuel)
            const historiquePassé = historique.slice(0, -1);
            let listeDates = '\nDates disponibles :\n';
            historiquePassé.forEach((jour, index) => {
                const dateFormatee = DateFormatter.formatShort(jour.date_jour);
                listeDates += `${index + 1}. ${dateFormatee} (${jour.compteur_passages} passage${jour.compteur_passages > 1 ? 's' : ''})\n`;
            });

            const message = `🗑️ Effacer l'historique des passages\n\n` +
                `Entrez le(s) numéro(s) à effacer :\n\n` +
                `Format : "1-5" (de la date 1 à la date 5)\n` +
                `ou "3" (uniquement la date 3)\n` +
                `ou "tout" (effacer TOUT l'historique)\n` +
                listeDates;

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
                // Plage de dates
                const [indexDebut, indexFin] = trimmed.split('-').map(n => parseInt(n.trim()));

                if (isNaN(indexDebut) || isNaN(indexFin) ||
                    indexDebut < 1 || indexFin > historiquePassé.length ||
                    indexDebut > indexFin) {
                    NotificationService.error(`Plage invalide ! Utilisez un format entre 1 et ${historiquePassé.length}`);
                    return;
                }

                const jourDebut = historiquePassé[indexDebut - 1];
                const jourFin = historiquePassé[indexFin - 1];
                const dateDebut = DateFormatter.formatShort(jourDebut.date_jour);
                const dateFin = DateFormatter.formatShort(jourFin.date_jour);

                if (!NotificationService.confirm(`⚠️ Effacer les données du ${dateDebut} au ${dateFin} ?\n\nCette action est irréversible !`)) {
                    return;
                }

                // Récupérer les numero_jour correspondants
                const numeroDebut = jourDebut.numero_jour;
                const numeroFin = jourFin.numero_jour;
                await this.deleteDays('plage', { debut: numeroDebut, fin: numeroFin });
            } else {
                // Date unique
                const index = parseInt(trimmed);

                if (isNaN(index) || index < 1 || index > historiquePassé.length) {
                    NotificationService.error(`Numéro invalide ! Choisissez entre 1 et ${historiquePassé.length}`);
                    return;
                }

                const jourAEffacer = historiquePassé[index - 1];
                const dateAEffacer = DateFormatter.formatShort(jourAEffacer.date_jour);

                if (!NotificationService.confirm(`⚠️ Effacer les données du ${dateAEffacer} ?\n\nCette action est irréversible !`)) {
                    return;
                }

                const numeroJour = jourAEffacer.numero_jour;
                await this.deleteDays('jour', { jour: numeroJour });
            }

            // Rafraîchir l'affichage après suppression
            await this.init();
        } catch (error) {
            Logger.error('Erreur ouverture menu effacement:', error);
            NotificationService.error('Erreur lors du chargement de l\'historique');
        }
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
