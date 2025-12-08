// assets/js/services/GdprService.js
// Numérotation anonyme des navires (conformité RGPD)

import { CONFIG } from '../config.js';
import { StorageService } from './StorageService.js';

export class GdprService {
    constructor() {
        this.numberedShips = StorageService.get(CONFIG.GDPR.STORAGE_KEY_SHIPS, {});
        this.nextNumber = StorageService.get(CONFIG.GDPR.STORAGE_KEY_NEXT_NUMBER, 1);
        this.lastReset = StorageService.get(CONFIG.GDPR.STORAGE_KEY_LAST_RESET, new Date().toDateString());

        // Vérifier si un reset quotidien est nécessaire
        this.resetIfNeeded();
    }

    /**
     * Obtient le numéro anonyme d'un navire (existant ou nouveau)
     * @param {string} trackId - ID du navire
     * @returns {string} Numéro anonyme (ex: "N1", "N2")
     */
    getShipNumber(trackId) {
        if (!trackId) return null;

        // Si le navire a déjà un numéro, le retourner
        if (this.numberedShips[trackId]) {
            // Mettre à jour la dernière vue
            this.numberedShips[trackId].lastSeen = Date.now();
            this.save();
            return this.numberedShips[trackId].number;
        }

        // Sinon, attribuer un nouveau numéro
        return this.assignNumber(trackId);
    }

    /**
     * Attribue un nouveau numéro à un navire
     * @param {string} trackId
     * @returns {string} Numéro attribué
     */
    assignNumber(trackId) {
        const number = `${CONFIG.GDPR.PREFIX_NUMERO}${this.nextNumber}`;

        this.numberedShips[trackId] = {
            number: number,
            assignedAt: Date.now(),
            lastSeen: Date.now()
        };

        this.nextNumber++;
        this.save();

        return number;
    }

    /**
     * Nettoyage des navires non vus depuis la durée de rétention
     */
    cleanup() {
        const now = Date.now();
        const retention = CONFIG.GDPR.DUREE_RETENTION_NUMEROTATION;
        let cleaned = 0;

        Object.keys(this.numberedShips).forEach(trackId => {
            const ship = this.numberedShips[trackId];
            if (now - ship.lastSeen > retention) {
                delete this.numberedShips[trackId];
                cleaned++;
            }
        });

        if (cleaned > 0) {
            console.log(`[GDPR] ${cleaned} navire(s) nettoyé(s) (non vus depuis 24h)`);
            this.save();
        }
    }

    /**
     * Reset quotidien de la numérotation
     */
    resetIfNeeded() {
        const today = new Date().toDateString();

        if (this.lastReset !== today) {
            console.log('[GDPR] Reset quotidien de la numérotation');
            this.numberedShips = {};
            this.nextNumber = 1;
            this.lastReset = today;
            this.save();
        }
    }

    /**
     * Sauvegarde l'état dans le localStorage
     */
    save() {
        StorageService.set(CONFIG.GDPR.STORAGE_KEY_SHIPS, this.numberedShips);
        StorageService.set(CONFIG.GDPR.STORAGE_KEY_NEXT_NUMBER, this.nextNumber);
        StorageService.set(CONFIG.GDPR.STORAGE_KEY_LAST_RESET, this.lastReset);
    }

    /**
     * Retourne le nombre de navires numérotés
     * @returns {number}
     */
    getShipCount() {
        return Object.keys(this.numberedShips).length;
    }

    /**
     * Retourne le prochain numéro qui sera attribué
     * @returns {number}
     */
    getNextNumber() {
        return this.nextNumber;
    }

    /**
     * Retourne tous les navires numérotés
     * @returns {Object}
     */
    getAllNumberedShips() {
        return { ...this.numberedShips };
    }

    /**
     * Reset manuel complet
     */
    reset() {
        this.numberedShips = {};
        this.nextNumber = 1;
        this.lastReset = new Date().toDateString();
        this.save();
        console.log('[GDPR] Reset manuel effectué');
    }
}
