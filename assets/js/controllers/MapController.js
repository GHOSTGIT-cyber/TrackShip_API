// assets/js/controllers/MapController.js
// Contrôle de la carte Leaflet

import { CONFIG } from '../config.js';
import { Logger } from '../utils/Logger.js';

export class MapController {
    constructor() {
        this.map = null;
        this.baseMarker = null;
        this.shipMarkers = new Map(); // trackId => marker
        this.alerteZoneCircle = null;
        this.vigilanceZoneCircle = null;
        this.approcheZoneCircle = null;
    }

    /**
     * Initialise la carte Leaflet
     * @param {Object} coords - { lat, lon }
     * @returns {L.Map}
     */
    init(coords = CONFIG.BASE_COORDS) {
        Logger.info('Initialisation de la carte');

        // Créer la carte
        this.map = L.map('map').setView([coords.lat, coords.lon], CONFIG.MAP.DEFAULT_ZOOM);

        // Ajouter la couche de tuiles
        L.tileLayer(CONFIG.MAP.TILE_LAYER, {
            attribution: CONFIG.MAP.ATTRIBUTION,
            minZoom: CONFIG.MAP.MIN_ZOOM,
            maxZoom: CONFIG.MAP.MAX_ZOOM
        }).addTo(this.map);

        // Créer le marqueur de base
        this.createBaseMarker(coords);

        // Créer les cercles de zones
        this.createZoneCircles(coords);

        return this.map;
    }

    /**
     * Crée le marqueur de la base avec LOGO Foil in Paris
     * @param {Object} coords
     */
    createBaseMarker(coords) {
        const icon = L.icon({
            iconUrl: CONFIG.BASE_ICON.url,
            iconSize: CONFIG.BASE_ICON.size,
            iconAnchor: CONFIG.BASE_ICON.anchor,
            popupAnchor: CONFIG.BASE_ICON.popupAnchor
        });

        this.baseMarker = L.marker([coords.lat, coords.lon], { icon })
            .addTo(this.map)
            .bindPopup('<strong>📍 Base de surveillance Foil in Paris</strong>');
    }

    /**
     * Crée les cercles de zones de surveillance
     * @param {Object} coords
     */
    createZoneCircles(coords) {
        // Zone alerte (≤1km)
        this.alerteZoneCircle = L.circle([coords.lat, coords.lon], {
            radius: CONFIG.ZONES.ZONE_ALERTE,
            color: CONFIG.MARKER_COLORS.alerte,
            fillColor: CONFIG.MARKER_COLORS.alerte,
            fillOpacity: 0.1,
            weight: 2
        }).addTo(this.map);

        // Zone vigilance (1-2km)
        this.vigilanceZoneCircle = L.circle([coords.lat, coords.lon], {
            radius: CONFIG.ZONES.ZONE_VIGILANCE,
            color: CONFIG.MARKER_COLORS.vigilance,
            fillColor: CONFIG.MARKER_COLORS.vigilance,
            fillOpacity: 0.08,
            weight: 2
        }).addTo(this.map);

        // Zone approche (2-3km)
        this.approcheZoneCircle = L.circle([coords.lat, coords.lon], {
            radius: CONFIG.ZONES.ZONE_APPROCHE,
            color: CONFIG.MARKER_COLORS.approche,
            fillColor: CONFIG.MARKER_COLORS.approche,
            fillOpacity: 0.05,
            weight: 2
        }).addTo(this.map);
    }

    /**
     * Met à jour les marqueurs des navires
     * @param {Array} ships - Liste des navires
     * @param {Map} analysisResults - Résultats d'analyse par trackId
     * @param {GdprService} gdprService - Service GDPR pour numérotation
     */
    updateShipMarkers(ships, analysisResults, gdprService) {
        const currentTrackIds = new Set();

        ships.forEach(ship => {
            currentTrackIds.add(ship.trackId);
            const analysis = analysisResults.get(ship.trackId);

            if (!analysis) return;

            if (this.shipMarkers.has(ship.trackId)) {
                // Mettre à jour marqueur existant
                this.updateMarker(ship, analysis, gdprService);
            } else {
                // Créer nouveau marqueur
                this.createShipMarker(ship, analysis, gdprService);
            }
        });

        // Supprimer les marqueurs des navires qui ne sont plus présents
        this.shipMarkers.forEach((marker, trackId) => {
            if (!currentTrackIds.has(trackId)) {
                this.map.removeLayer(marker);
                this.shipMarkers.delete(trackId);
            }
        });
    }

    /**
     * Crée un marqueur pour un navire
     * @param {Object} ship
     * @param {Object} analysis
     * @param {GdprService} gdprService
     */
    createShipMarker(ship, analysis, gdprService) {
        const color = CONFIG.MARKER_COLORS[analysis.status];
        const shipNumber = gdprService.getShipNumber(ship.trackId);

        // Utiliser une flèche SVG pour indiquer la direction
        const rotation = ship.cog || 0; // Course over ground

        const icon = L.divIcon({
            className: 'ship-marker',
            html: `
                <svg width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));">
                    <path d="M12 2 L5 20 L12 16 L19 20 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
                </svg>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([ship.lat, ship.lon], { icon })
            .addTo(this.map)
            .bindPopup(this.createPopupContent(ship, analysis, shipNumber));

        this.shipMarkers.set(ship.trackId, marker);
    }

    /**
     * Met à jour un marqueur existant
     * @param {Object} ship
     * @param {Object} analysis
     * @param {GdprService} gdprService
     */
    updateMarker(ship, analysis, gdprService) {
        const marker = this.shipMarkers.get(ship.trackId);
        if (!marker) return;

        // Mettre à jour la position
        marker.setLatLng([ship.lat, ship.lon]);

        // Mettre à jour l'icône avec nouvelle couleur et rotation
        const color = CONFIG.MARKER_COLORS[analysis.status];
        const rotation = ship.cog || 0;

        marker.setIcon(L.divIcon({
            className: 'ship-marker',
            html: `
                <svg width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));">
                    <path d="M12 2 L5 20 L12 16 L19 20 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
                </svg>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        }));

        // Mettre à jour le popup
        const shipNumber = gdprService.getShipNumber(ship.trackId);
        marker.setPopupContent(this.createPopupContent(ship, analysis, shipNumber));
    }

    /**
     * Crée le contenu du popup pour un navire
     * @param {Object} ship
     * @param {Object} analysis
     * @param {string} shipNumber
     * @returns {string} HTML du popup
     */
    createPopupContent(ship, analysis, shipNumber) {
        const distanceKm = (analysis.distance / 1000).toFixed(2);
        const statusIcon = {
            alerte: '🔴',
            attention: '🟠',
            surveillance: '🟢',
            hors_zone: '⚪'
        }[analysis.status];

        return `
            <div style="min-width: 200px;">
                <strong>🚢 ${shipNumber}</strong><br>
                <strong>Statut:</strong> ${statusIcon} ${analysis.status.toUpperCase()}<br>
                <strong>Distance:</strong> ${distanceKm} km<br>
                <strong>Vitesse:</strong> ${analysis.speed.toFixed(1)} nœuds<br>
                <strong>Cap:</strong> ${analysis.course.toFixed(0)}°<br>
                <strong>Conforme:</strong> ${analysis.isConform ? '✅ Oui' : '❌ Non'}<br>
                ${!analysis.isWater ? '<span style="color: red;">⚠️ Sur terre</span><br>' : ''}
                ${analysis.isLandEmitter ? '<span style="color: orange;">⚠️ Émetteur terrestre</span><br>' : ''}
            </div>
        `;
    }

    /**
     * Centre la carte sur un navire
     * @param {string} trackId
     * @param {number} zoom
     */
    centerOnShip(trackId, zoom = 13) {
        const marker = this.shipMarkers.get(trackId);
        if (marker) {
            this.map.setView(marker.getLatLng(), zoom);
            marker.openPopup();
        }
    }

    /**
     * Centre la carte sur la base
     * @param {number} zoom
     */
    centerOnBase(zoom = CONFIG.MAP.DEFAULT_ZOOM) {
        if (this.baseMarker) {
            this.map.setView(this.baseMarker.getLatLng(), zoom);
        }
    }

    /**
     * Met à jour la position de la base
     * @param {Object} coords - { lat, lon }
     */
    updateBasePosition(coords) {
        if (this.baseMarker) {
            this.baseMarker.setLatLng([coords.lat, coords.lon]);
        }

        // Mettre à jour les cercles de zones
        if (this.alerteZoneCircle) this.alerteZoneCircle.setLatLng([coords.lat, coords.lon]);
        if (this.vigilanceZoneCircle) this.vigilanceZoneCircle.setLatLng([coords.lat, coords.lon]);
        if (this.approcheZoneCircle) this.approcheZoneCircle.setLatLng([coords.lat, coords.lon]);
    }

    /**
     * Retourne la carte Leaflet
     * @returns {L.Map}
     */
    getMap() {
        return this.map;
    }
}
