// assets/js/views/StatusBarView.js
// Gestion de la barre d'état verte en haut de la page

import { Logger } from '../utils/Logger.js';

export class StatusBarView {
    constructor() {
        this.statusBar = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
    }

    /**
     * Affiche la barre d'état
     */
    show() {
        if (this.statusBar) {
            this.statusBar.style.display = 'flex';
            this.statusBar.classList.add('status-connected');
            this.statusBar.classList.remove('status-error', 'status-warning');
        }
    }

    /**
     * Masque la barre d'état
     */
    hide() {
        if (this.statusBar) {
            this.statusBar.style.display = 'none';
        }
    }

    /**
     * Met à jour le texte de la barre d'état
     * @param {number} totalShips - Nombre total de navires
     * @param {number} numberedShips - Nombre de navires numérotés
     */
    update(totalShips, numberedShips) {
        if (!this.statusText) return;

        const text = `${totalShips} navires surveillés - ${numberedShips} numérotés`;
        this.statusText.textContent = text;

        Logger.debug(`Barre d'état mise à jour: ${text}`);
    }

    /**
     * Affiche un message de succès
     * @param {string} message
     */
    showSuccess(message) {
        if (!this.statusBar || !this.statusText) return;

        this.statusBar.style.display = 'flex';
        this.statusBar.classList.remove('status-error', 'status-warning');
        this.statusBar.classList.add('status-connected');
        this.statusText.textContent = message;
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message
     */
    showError(message) {
        if (!this.statusBar || !this.statusText) return;

        this.statusBar.style.display = 'flex';
        this.statusBar.classList.remove('status-connected', 'status-warning');
        this.statusBar.classList.add('status-error');
        this.statusText.textContent = `❌ ${message}`;
    }

    /**
     * Affiche un message d'avertissement
     * @param {string} message
     */
    showWarning(message) {
        if (!this.statusBar || !this.statusText) return;

        this.statusBar.style.display = 'flex';
        this.statusBar.classList.remove('status-connected', 'status-error');
        this.statusBar.classList.add('status-warning');
        this.statusText.textContent = `⚠️ ${message}`;
    }

    /**
     * Affiche un message de chargement
     * @param {string} message
     */
    showLoading(message = 'Chargement en cours...') {
        if (!this.statusBar || !this.statusText) return;

        this.statusBar.style.display = 'flex';
        this.statusBar.classList.remove('status-error', 'status-warning');
        this.statusBar.classList.add('status-connected');
        this.statusText.textContent = `⏳ ${message}`;
    }
}
