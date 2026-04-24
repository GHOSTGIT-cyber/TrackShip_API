// assets/js/views/RefreshBadgeView.js
// Gestion du badge de rafraîchissement (coin supérieur droit)

import { CONFIG } from '../config.js';
import { Logger } from '../utils/Logger.js';

export class RefreshBadgeView {
    constructor() {
        this.badge = document.getElementById('compteurRefresh');
        this.timeSpan = document.getElementById('tempsRestant');
        this.modeSpan = document.getElementById('modeActualisation');
        this.countdownInterval = null;
        this.remainingSeconds = 0;
        this.currentMode = 'normal';
    }

    /**
     * Affiche le badge
     */
    show() {
        if (this.badge) {
            this.badge.style.display = 'block';
        }
    }

    /**
     * Masque le badge
     */
    hide() {
        if (this.badge) {
            this.badge.style.display = 'none';
        }
        this.stopCountdown();
    }

    /**
     * Démarre le compte à rebours
     * @param {string} mode - 'normal' ou 'alerte'
     */
    startCountdown(mode = 'normal') {
        this.stopCountdown();
        this.currentMode = mode;

        // Déterminer la durée selon le mode
        const duration = mode === 'alerte' ? CONFIG.REFRESH.ALERTE : CONFIG.REFRESH.NORMAL;
        this.remainingSeconds = Math.floor(duration / 1000);

        // Mettre à jour le texte du mode
        if (this.modeSpan) {
            if (mode === 'alerte') {
                this.modeSpan.textContent = 'Mode: Alerte (2s)';
                this.modeSpan.style.color = '#dc3545';
                this.modeSpan.style.fontWeight = 'bold';
            } else {
                this.modeSpan.textContent = 'Mode: Normal (10s)';
                this.modeSpan.style.color = '';
                this.modeSpan.style.fontWeight = '';
            }
        }

        // Afficher immédiatement
        this.updateDisplay();

        // Démarrer le décompte
        this.countdownInterval = setInterval(() => {
            this.remainingSeconds--;

            if (this.remainingSeconds < 0) {
                this.remainingSeconds = Math.floor(duration / 1000);
            }

            this.updateDisplay();
        }, 1000);

        Logger.debug(`Countdown démarré en mode ${mode} (${this.remainingSeconds}s)`);
    }

    /**
     * Arrête le compte à rebours
     */
    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    /**
     * Met à jour l'affichage du temps restant
     */
    updateDisplay() {
        if (this.timeSpan) {
            this.timeSpan.textContent = this.remainingSeconds;
        }
    }

    /**
     * Réinitialise le compte à rebours (repart à la valeur max)
     */
    reset() {
        const duration = this.currentMode === 'alerte' ? CONFIG.REFRESH.ALERTE : CONFIG.REFRESH.NORMAL;
        this.remainingSeconds = Math.floor(duration / 1000);
        this.updateDisplay();
    }

    /**
     * Change le mode de rafraîchissement
     * @param {string} mode - 'normal' ou 'alerte'
     */
    setMode(mode) {
        if (mode !== this.currentMode) {
            Logger.info(`Changement de mode de rafraîchissement: ${this.currentMode} → ${mode}`);
            this.startCountdown(mode);
        }
    }

    /**
     * Retourne le mode actuel
     * @returns {string}
     */
    getMode() {
        return this.currentMode;
    }
}
