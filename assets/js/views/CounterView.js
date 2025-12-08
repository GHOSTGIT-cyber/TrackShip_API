// assets/js/views/CounterView.js
// Rendu du panneau de compteur

export class CounterView {
    /**
     * Affiche le compteur journalier
     * @param {Object} historyData - { historique: [...], total_cumule: ... }
     */
    render(historyData) {
        const panel = document.getElementById('panneauCompteurJournalier');
        if (!panel) return;

        const currentDay = historyData.historique[historyData.historique.length - 1];
        if (!currentDay) {
            panel.innerHTML = '<p>Aucun compteur disponible</p>';
            return;
        }

        const pastDays = historyData.historique.slice(0, -1).reverse();

        let html = `
            <h3>📊 Compteur de passages - Zone Rouge</h3>
            <div class="compteur-jour-actuel">
                <div class="jour-label">Jour ${currentDay.numero_jour} (Aujourd'hui)</div>
                <div class="jour-compteur">${currentDay.compteur_passages} passage${currentDay.compteur_passages > 1 ? 's' : ''}</div>
            </div>
            <div class="compteur-total">
                <strong>Total cumulé:</strong> ${historyData.total_cumule} passages sur ${currentDay.numero_jour} jour${currentDay.numero_jour > 1 ? 's' : ''}
            </div>
        `;

        if (pastDays.length > 0) {
            html += `
                <div class="compteur-historique-toggle" onclick="window.TrackShipApp.toggleHistorique()">
                    <span id="historique-icon">▶</span> Voir l'historique (${pastDays.length} jour${pastDays.length > 1 ? 's' : ''})
                </div>
                <div class="compteur-historique" id="historiqueContent" style="display: none;">
                    ${pastDays.map(day => `
                        <div class="jour-item">
                            <span class="jour-numero">Jour ${day.numero_jour}</span>
                            <span class="jour-valeur">${day.compteur_passages} passage${day.compteur_passages > 1 ? 's' : ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        html += `<button class="btn-effacer-historique" onclick="window.TrackShipApp.openDeleteMenu()">🗑️ Effacer des données</button>`;

        panel.innerHTML = html;
    }
}
