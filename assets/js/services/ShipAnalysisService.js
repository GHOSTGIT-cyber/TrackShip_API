// assets/js/services/ShipAnalysisService.js
// Analyse et validation des navires

import { CONFIG } from '../config.js';
import { ZoneService } from './ZoneService.js';

export class ShipAnalysisService {
    /**
     * Analyse complète d'un navire
     * @param {Object} ship - Données du navire
     * @param {Object} baseCoords - Coordonnées de la base { lat, lon }
     * @returns {Object} Résultat de l'analyse
     */
    static analyzeShip(ship, baseCoords) {
        // Calculs de base
        const distance = ZoneService.calculateDistance(
            ship.lat,
            ship.lon,
            baseCoords.lat,
            baseCoords.lon
        );

        const isWater = this.isOnWater(ship);
        const isLandEmitter = this.isLandEmitter(ship);
        const isMoving = this.isStableMovement(ship);
        const status = ZoneService.getZoneStatus(distance);

        // Vérifications de conformité
        const isConform = this.isShipConform(ship, isWater, isLandEmitter);
        const isNonConformMoving = this.isNonConformMoving(ship, isWater, isLandEmitter, isMoving);

        return {
            distance,
            status,
            isConform,
            isNonConformMoving,
            isWater,
            isLandEmitter,
            isMoving,
            speed: ship.sog || 0,
            course: ship.cog || 0,
            displayName: ship.name || ship.trackId || 'Inconnu'
        };
    }

    /**
     * Vérifie si un navire est conforme
     * @param {Object} ship
     * @param {boolean} isWater
     * @param {boolean} isLandEmitter
     * @returns {boolean}
     */
    static isShipConform(ship, isWater, isLandEmitter) {
        // TOUS les navires détectés sont affichés sur la carte
        // MAIS on maintient une distinction conforme/non-conforme pour les listes

        // Critères de conformité des données
        const hasSpeed = ship.sog !== null && ship.sog !== undefined;
        const hasName = ship.fairwayName && ship.fairwayName.trim() !== '';
        const hasLength = ship.length && parseFloat(ship.length) > 0;
        const hasMMSI = ship.mmsi && ship.mmsi.toString().length >= 6;

        // Un navire est conforme s'il a au moins un nom ET un MMSI valide
        // (Émetteurs terrestres et navires sur eau sont tous considérés conformes s'ils ont ces données)
        return hasName && hasMMSI;
    }

    /**
     * Vérifie si un navire non-conforme est en mouvement
     * @param {Object} ship
     * @param {boolean} isWater
     * @param {boolean} isLandEmitter
     * @param {boolean} isMoving
     * @returns {boolean}
     */
    static isNonConformMoving(ship, isWater, isLandEmitter, isMoving) {
        // Non conforme = manque des données critiques ET est en mouvement
        const hasSpeed = ship.sog !== null && ship.sog !== undefined && parseFloat(ship.sog) > 0.5;
        const manqueNom = !ship.fairwayName || ship.fairwayName.trim() === '';
        const manqueMMSI = !ship.mmsi || ship.mmsi.toString().length < 6;
        const manqueLongueur = !ship.length || parseFloat(ship.length) <= 0;

        // Non conforme en mouvement = manque données ET peut bouger
        return hasSpeed && (manqueNom || manqueMMSI || manqueLongueur);
    }

    /**
     * Détecte si un navire est en mouvement stable
     * @param {Object} ship
     * @returns {boolean}
     */
    static isStableMovement(ship) {
        // Vérifier la vitesse
        const speed = ship.sog || 0;
        if (speed < CONFIG.VALIDATION.MIN_SPEED) {
            return false;
        }

        // Si l'historique de position existe, vérifier la stabilité du mouvement
        if (ship.positionHistory && ship.positionHistory.length >= CONFIG.VALIDATION.MIN_HISTORY_LENGTH) {
            // Vérifier que les dernières positions montrent un mouvement cohérent
            const recentPositions = ship.positionHistory.slice(-CONFIG.VALIDATION.MIN_HISTORY_LENGTH);

            // Calculer les distances entre positions successives
            let totalDistance = 0;
            for (let i = 1; i < recentPositions.length; i++) {
                const dist = ZoneService.calculateDistance(
                    recentPositions[i - 1].lat,
                    recentPositions[i - 1].lon,
                    recentPositions[i].lat,
                    recentPositions[i].lon
                );
                totalDistance += dist;
            }

            // Si la distance totale est significative, le navire est en mouvement
            return totalDistance > 50; // 50 mètres minimum sur les dernières positions
        }

        // Par défaut, se fier uniquement à la vitesse
        return true;
    }

    /**
     * Vérifie si le navire est sur l'eau (Seine Paris)
     * @param {Object} ship
     * @returns {boolean}
     */
    static isOnWater(ship) {
        return ZoneService.isOnWater(ship.lat, ship.lon);
    }

    /**
     * Détecte si c'est un émetteur terrestre (station de base)
     * @param {Object} ship
     * @returns {boolean}
     */
    static isLandEmitter(ship) {
        const name = (ship.name || '').toUpperCase();

        // Vérifier si le nom contient des mots-clés d'émetteur terrestre
        return CONFIG.VALIDATION.LAND_EMITTER_KEYWORDS.some(keyword =>
            name.includes(keyword)
        );
    }

    /**
     * Calcule des statistiques sur un ensemble de navires
     * @param {Array} ships - Liste des navires
     * @param {Map} analysisResults - Résultats d'analyse par trackId
     * @returns {Object} Statistiques
     */
    static calculateStats(ships, analysisResults) {
        const stats = {
            total: ships.length,
            conforme: 0,
            nonConforme: 0,
            nonConformeEnMouvement: 0,
            parZone: {
                alerte: 0,
                attention: 0,
                surveillance: 0,
                hors_zone: 0
            },
            parStatut: {
                eau: 0,
                terre: 0,
                emetteurTerrestre: 0,
                enMouvement: 0
            }
        };

        ships.forEach(ship => {
            const analysis = analysisResults.get(ship.trackId);
            if (!analysis) return;

            // Compteurs de conformité
            if (analysis.isConform) stats.conforme++;
            else stats.nonConforme++;

            if (analysis.isNonConformMoving) stats.nonConformeEnMouvement++;

            // Compteurs par zone
            stats.parZone[analysis.status]++;

            // Compteurs par statut
            if (analysis.isWater) stats.parStatut.eau++;
            else stats.parStatut.terre++;

            if (analysis.isLandEmitter) stats.parStatut.emetteurTerrestre++;
            if (analysis.isMoving) stats.parStatut.enMouvement++;
        });

        return stats;
    }

    /**
     * Détermine le niveau d'alerte global
     * @param {Object} stats - Statistiques calculées
     * @returns {string} 'normal', 'attention', 'alerte'
     */
    static getGlobalAlertLevel(stats) {
        if (stats.parZone.alerte > 0) {
            return 'alerte';
        } else if (stats.parZone.attention > 0 || stats.nonConformeEnMouvement > 0) {
            return 'attention';
        } else {
            return 'normal';
        }
    }
}
