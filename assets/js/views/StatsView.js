// assets/js/views/StatsView.js
// Rendu du panneau de statistiques - Format original exact

import { Logger } from '../utils/Logger.js';

export class StatsView {
    /**
     * Affiche les statistiques selon le format original
     * @param {Object} stats - Statistiques calculées
     */
    render(stats) {
        // Mettre à jour Zone d'approche (3km)
        const naviresApproche = document.getElementById('naviresApproche');
        if (naviresApproche) {
            naviresApproche.textContent = stats.approche || 0;
        }

        // Mettre à jour Zone vigilance (2km)
        const naviresVigilance = document.getElementById('naviresVigilance');
        if (naviresVigilance) {
            naviresVigilance.textContent = stats.vigilance || 0;
        }

        // Mettre à jour Zone alerte (1km)
        const naviresAlerte = document.getElementById('naviresAlerte');
        if (naviresAlerte) {
            naviresAlerte.textContent = stats.alerte || 0;
        }

        // Mettre à jour Trackés en temps réel
        const naviresTrackes = document.getElementById('naviresTrackes');
        if (naviresTrackes) {
            naviresTrackes.textContent = stats.tracked || 0;
        }

        // Mettre à jour Navires numérotés
        const naviresNumerotes = document.getElementById('naviresNumerotes');
        if (naviresNumerotes) {
            naviresNumerotes.textContent = stats.numbered || 0;
        }

        // Mettre à jour Dernière MAJ
        const derniereMaj = document.getElementById('derniereMaj');
        if (derniereMaj) {
            const now = new Date();
            const time = now.toLocaleTimeString('fr-FR');
            derniereMaj.textContent = time;
        }

        Logger.debug(`Stats mises à jour: ${stats.approche} approche, ${stats.vigilance} vigilance, ${stats.alerte} alerte`);
    }

    /**
     * Réinitialise toutes les statistiques à zéro
     */
    clear() {
        this.render({
            approche: 0,
            vigilance: 0,
            alerte: 0,
            tracked: 0,
            numbered: 0
        });

        const derniereMaj = document.getElementById('derniereMaj');
        if (derniereMaj) {
            derniereMaj.textContent = '--:--:--';
        }
    }
}
