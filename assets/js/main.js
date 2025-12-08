// assets/js/main.js
// Point d'entrée principal de l'application TrackShip - Version MVC CORRECTE

import { CONFIG } from './config.js';
import { MapController } from './controllers/MapController.js';
import { CounterController } from './controllers/CounterController.js';
import { ShipController } from './controllers/ShipController.js';
import { GdprService } from './services/GdprService.js';
import { ZoneService } from './services/ZoneService.js';
import { ShipAnalysisService } from './services/ShipAnalysisService.js';
import { StorageService } from './services/StorageService.js';
import { NotificationService } from './services/NotificationService.js';
import { Logger } from './utils/Logger.js';
import { CounterView } from './views/CounterView.js';
import { StatsView } from './views/StatsView.js';
import { ShipListView } from './views/ShipListView.js';
import { RefreshBadgeView } from './views/RefreshBadgeView.js';
import { StatusBarView } from './views/StatusBarView.js';

/**
 * Classe principale de l'application TrackShip
 */
class TrackShipApp {
    constructor() {
        // Contrôleurs
        this.mapController = new MapController();
        this.counterController = new CounterController();
        this.shipController = new ShipController();

        // Services
        this.gdprService = new GdprService();

        // Views
        this.counterView = new CounterView();
        this.statsView = new StatsView();
        this.shipListView = new ShipListView();
        this.refreshBadgeView = new RefreshBadgeView();
        this.statusBarView = new StatusBarView();

        // État de surveillance
        this.surveillanceActive = false;
        this.refreshInterval = null;
        this.currentRefreshRate = CONFIG.REFRESH.NORMAL;

        // Coordonnées de la base
        this.baseCoords = CONFIG.BASE_COORDS;

        // Données actuelles
        this.currentShips = [];
        this.currentAnalysisResults = new Map();
    }

    /**
     * Initialisation de l'application
     */
    async init() {
        Logger.info('🚀 Initialisation de TrackShip');

        try {
            // Initialiser la carte
            this.mapController.init(this.baseCoords);
            Logger.success('Carte initialisée');

            // Initialiser le compteur
            await this.counterController.init();
            Logger.success('Compteur initialisé');

            // Afficher le compteur initial
            await this.updateCounterDisplay();

            // Reset GDPR si nécessaire
            this.gdprService.resetIfNeeded();

            // Nettoyage GDPR
            this.gdprService.cleanup();

            // Attacher les événements
            this.attachEvents();

            // Initialiser les views
            this.statsView.clear();
            this.shipListView.clear();
            this.refreshBadgeView.hide();
            this.statusBarView.hide();

            Logger.success('✅ Application initialisée avec succès');
            NotificationService.success('TrackShip prêt');

        } catch (error) {
            Logger.error('Erreur initialisation:', error);
            NotificationService.error('Erreur lors de l\'initialisation');
        }
    }

    /**
     * Démarre la surveillance
     */
    async startSurveillance() {
        if (this.surveillanceActive) {
            Logger.warn('Surveillance déjà active');
            return;
        }

        // Vérifier le token
        const token = document.getElementById('token')?.value.trim();
        if (!token) {
            NotificationService.error('Veuillez entrer un token EuRIS valide');
            return;
        }

        // Sauvegarder le token
        StorageService.set(CONFIG.EURIS.TOKEN_STORAGE_KEY, token);

        Logger.info('Démarrage de la surveillance');
        this.surveillanceActive = true;

        // Mettre à jour le bouton
        const btnStart = document.getElementById('btnSurveillance');
        if (btnStart) {
            btnStart.textContent = '⏸️ Arrêter la surveillance';
            btnStart.classList.add('btn-stop');
        }

        // Afficher badge refresh et status bar
        this.refreshBadgeView.show();
        this.refreshBadgeView.startCountdown('normal');
        this.statusBarView.showLoading('Chargement des données...');

        // Première mise à jour immédiate
        await this.updateData();

        // Lancer le rafraîchissement automatique
        this.startAutoRefresh();

        NotificationService.success('Surveillance démarrée');
    }

    /**
     * Arrête la surveillance
     */
    stopSurveillance() {
        if (!this.surveillanceActive) {
            Logger.warn('Surveillance déjà arrêtée');
            return;
        }

        Logger.info('Arrêt de la surveillance');
        this.surveillanceActive = false;

        // Arrêter le rafraîchissement
        this.stopAutoRefresh();

        // Mettre à jour le bouton
        const btnStart = document.getElementById('btnSurveillance');
        if (btnStart) {
            btnStart.textContent = '🔍 Démarrer la surveillance';
            btnStart.classList.remove('btn-stop');
        }

        // Masquer badge refresh et status bar
        this.refreshBadgeView.hide();
        this.statusBarView.hide();

        // Effacer les listes
        this.shipListView.clear();
        this.statsView.clear();

        NotificationService.info('Surveillance arrêtée');
    }

    /**
     * Met à jour toutes les données
     */
    async updateData() {
        if (!this.surveillanceActive) return;

        Logger.time('updateData');

        try {
            // 1. Récupérer le token
            const token = StorageService.get(CONFIG.EURIS.TOKEN_STORAGE_KEY);
            if (!token) {
                NotificationService.error(CONFIG.MESSAGES.ERROR_TOKEN);
                this.stopSurveillance();
                return;
            }

            // 2. Calculer le rayon dynamique
            const rayonInput = document.getElementById('rayon');
            const rayon = rayonInput ? parseInt(rayonInput.value) * 1000 : 3000; // Défaut 3km

            // 3. Calculer la bounding box avec rayon dynamique
            const bbox = ZoneService.calculateBoundingBox(
                this.baseCoords.lat,
                this.baseCoords.lon,
                rayon / 1000
            );

            // 4. Récupérer les navires
            const ships = await this.shipController.fetchShips(bbox, token);

            // 5. Filtrer selon type de navire
            const filteredShips = this.filterShipsByType(ships);

            // 6. Analyser les navires
            const analysisResults = this.shipController.analyzeShips(filteredShips, this.baseCoords);

            // Sauvegarder les données actuelles
            this.currentShips = filteredShips;
            this.currentAnalysisResults = analysisResults;

            // 7. Mettre à jour la carte
            this.mapController.updateShipMarkers(filteredShips, analysisResults, this.gdprService);

            // 8. Gérer le compteur zone rouge (alerte)
            await this.counterController.handleRedZoneEntry(filteredShips, analysisResults);

            // 9. Mettre à jour les statistiques
            this.updateStats(filteredShips, analysisResults);

            // 10. Mettre à jour les listes de navires
            this.updateShipLists(filteredShips, analysisResults);

            // 11. Mettre à jour le compteur
            await this.updateCounterDisplay();

            // 12. Mettre à jour la status bar
            const totalShips = filteredShips.length;
            const numberedShips = this.gdprService.getShipCount();
            this.statusBarView.update(totalShips, numberedShips);

            // 13. Ajuster le taux de rafraîchissement si alerte
            this.adjustRefreshRate(analysisResults);

            Logger.timeEnd('updateData');

        } catch (error) {
            Logger.error('Erreur updateData:', error);
            this.statusBarView.showError('Erreur lors de la mise à jour');
            NotificationService.error('Erreur lors de la mise à jour');
        }
    }

    /**
     * Filtre les navires selon le type sélectionné
     * @param {Array} ships
     * @returns {Array}
     */
    filterShipsByType(ships) {
        const filtreNavires = document.getElementById('filtreNavires');
        if (!filtreNavires) return ships;

        const filterValue = filtreNavires.value;

        switch (filterValue) {
            case 'mouvement':
                return ships.filter(ship => ship.sog > 0.1);
            case 'arret':
                return ships.filter(ship => ship.sog <= 0.1);
            case 'tous':
            default:
                return ships;
        }
    }

    /**
     * Met à jour l'affichage du compteur
     */
    async updateCounterDisplay() {
        try {
            const historyData = await this.counterController.getHistory();
            this.counterView.render(historyData);
        } catch (error) {
            Logger.error('Erreur updateCounterDisplay:', error);
        }
    }

    /**
     * Met à jour l'affichage des statistiques
     * @param {Array} ships
     * @param {Map} analysisResults
     */
    updateStats(ships, analysisResults) {
        let approche = 0;
        let vigilance = 0;
        let alerte = 0;

        for (const [trackId, analysis] of analysisResults) {
            if (analysis.distance <= CONFIG.ZONES.ZONE_ALERTE) {
                alerte++;
            } else if (analysis.distance <= CONFIG.ZONES.ZONE_VIGILANCE) {
                vigilance++;
            } else if (analysis.distance <= CONFIG.ZONES.ZONE_APPROCHE) {
                approche++;
            }
        }

        const tracked = ships.filter(ship => ship.sog > 0.1).length;
        const numbered = this.gdprService.getShipCount();

        this.statsView.render({
            approche,
            vigilance,
            alerte,
            tracked,
            numbered
        });
    }

    /**
     * Met à jour les listes de navires
     * @param {Array} ships
     * @param {Map} analysisResults
     */
    updateShipLists(ships, analysisResults) {
        // Enrichir les navires avec les résultats d'analyse
        const enrichedShips = ships.map(ship => {
            const analysis = analysisResults.get(ship.trackId);
            return {
                ...ship,
                ...analysis
            };
        });

        // Séparer conformes et non-conformes
        const conformes = enrichedShips.filter(ship => ship.isConform);
        const nonConformes = enrichedShips.filter(ship => !ship.isConform);

        // Ajouter le nom de zone à chaque navire
        conformes.forEach(ship => {
            if (ship.distance <= CONFIG.ZONES.ZONE_ALERTE) {
                ship.zoneName = 'Alerte (≤1km)';
                ship.zoneType = 'alerte';
            } else if (ship.distance <= CONFIG.ZONES.ZONE_VIGILANCE) {
                ship.zoneName = 'Vigilance (1-2km)';
                ship.zoneType = 'vigilance';
            } else if (ship.distance <= CONFIG.ZONES.ZONE_APPROCHE) {
                ship.zoneName = 'Approche (2-3km)';
                ship.zoneType = 'approche';
            } else {
                ship.zoneName = 'Hors zone';
                ship.zoneType = 'hors_zone';
            }
        });

        nonConformes.forEach(ship => {
            if (ship.distance <= CONFIG.ZONES.ZONE_ALERTE) {
                ship.zoneType = 'alerte';
            } else if (ship.distance <= CONFIG.ZONES.ZONE_VIGILANCE) {
                ship.zoneType = 'vigilance';
            } else if (ship.distance <= CONFIG.ZONES.ZONE_APPROCHE) {
                ship.zoneType = 'approche';
            } else {
                ship.zoneType = 'hors_zone';
            }
        });

        // Afficher les listes
        this.shipListView.renderConformes(conformes, this.gdprService);
        this.shipListView.renderNonConformes(nonConformes, this.gdprService);
        this.shipListView.renderPanneauAttention(nonConformes, this.gdprService);
    }

    /**
     * Ajuste le taux de rafraîchissement selon le niveau d'alerte
     * @param {Map} analysisResults
     */
    adjustRefreshRate(analysisResults) {
        let hasAlert = false;

        for (const [trackId, analysis] of analysisResults) {
            if (analysis.distance <= CONFIG.ZONES.ZONE_ALERTE) {
                hasAlert = true;
                break;
            }
        }

        const newMode = hasAlert ? 'alerte' : 'normal';
        const newRate = hasAlert ? CONFIG.REFRESH.ALERTE : CONFIG.REFRESH.NORMAL;

        if (newRate !== this.currentRefreshRate) {
            Logger.info(`Changement taux rafraîchissement: ${newRate}ms (${newMode})`);
            this.currentRefreshRate = newRate;

            // Mettre à jour le badge refresh
            this.refreshBadgeView.setMode(newMode);

            // Redémarrer l'auto-refresh avec le nouveau taux
            if (this.surveillanceActive) {
                this.stopAutoRefresh();
                this.startAutoRefresh();
            }
        }
    }

    /**
     * Démarre le rafraîchissement automatique
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            this.updateData();
        }, this.currentRefreshRate);

        Logger.info(`Auto-refresh démarré: ${this.currentRefreshRate}ms`);
    }

    /**
     * Arrête le rafraîchissement automatique
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            Logger.info('Auto-refresh arrêté');
        }
    }

    /**
     * Attache les événements globaux
     */
    attachEvents() {
        // Bouton démarrer/arrêter (toggle)
        const btnSurveillance = document.getElementById('btnSurveillance');
        if (btnSurveillance) {
            btnSurveillance.addEventListener('click', () => {
                if (this.surveillanceActive) {
                    this.stopSurveillance();
                } else {
                    this.startSurveillance();
                }
            });
        }

        // Bouton centrer carte (si présent)
        const btnCentrer = document.getElementById('btnCentrer');
        if (btnCentrer) {
            btnCentrer.addEventListener('click', () => this.mapController.centerOnBase());
        }

        // Toggle historique
        window.toggleHistorique = () => this.toggleHistorique();

        // Menu d'effacement
        window.ouvrirMenuEffacement = () => this.openDeleteMenu();

        Logger.info('Événements attachés');
    }

    /**
     * Toggle affichage de l'historique
     */
    toggleHistorique() {
        const content = document.getElementById('historiqueContent');
        const icon = document.getElementById('historique-icon');

        if (content && icon) {
            if (content.style.display === 'none' || !content.style.display) {
                content.style.display = 'block';
                icon.textContent = '▼';
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }
    }

    /**
     * Ouvre le menu d'effacement
     */
    async openDeleteMenu() {
        await this.counterController.openDeleteDialog();
        // Rafraîchir l'affichage après suppression
        await this.updateCounterDisplay();
    }

    /**
     * Met à jour la position de la base
     * @param {number} lat
     * @param {number} lon
     */
    updateBasePosition(lat, lon) {
        this.baseCoords = { lat, lon };
        this.mapController.updateBasePosition(this.baseCoords);
        StorageService.set('base_coords', this.baseCoords);
        Logger.success(`Position base mise à jour: ${lat}, ${lon}`);
    }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================

// Créer l'instance globale de l'application
window.TrackShipApp = null;

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
    Logger.info('DOM chargé, initialisation de l\'application...');

    // Créer et initialiser l'application
    window.TrackShipApp = new TrackShipApp();
    await window.TrackShipApp.init();
});

// Export pour utilisation en modules
export default TrackShipApp;
