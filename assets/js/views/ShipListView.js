// assets/js/views/ShipListView.js
// Rendu des listes de navires (conformes et non-conformes)

import { Logger } from '../utils/Logger.js';

export class ShipListView {
    /**
     * Affiche la liste des navires conformes
     * @param {Array} ships - Liste des navires conformes
     * @param {GdprService} gdprService - Service GDPR pour numérotation
     */
    renderConformes(ships, gdprService) {
        const container = document.getElementById('listeNavires');
        const count = document.getElementById('nbConformes');

        if (!container || !count) {
            Logger.warn('Éléments DOM pour navires conformes non trouvés');
            return;
        }

        count.textContent = ships.length;

        if (ships.length === 0) {
            container.innerHTML = '<div class="loading">Aucun navire conforme détecté</div>';
            return;
        }

        container.innerHTML = ships.map(ship => {
            const shipNumber = gdprService.getShipNumber(ship.trackId);
            const distanceKm = (ship.distance / 1000).toFixed(2);
            const speed = ship.sog.toFixed(1);
            const course = ship.cog.toFixed(0);

            return `
                <div class="navire-item navire-normal" onclick="window.TrackShipApp?.mapController?.centerOnShip('${ship.trackId}')">
                    <div class="navire-header">
                        <div class="navire-nom">
                            <span class="navire-numero">${shipNumber}</span>
                            ${ship.fairwayName || 'Inconnu'}
                        </div>
                        <span class="navire-distance distance-normal">${distanceKm} km</span>
                    </div>
                    <div class="navire-details">
                        <div class="navire-detail">
                            <span>Vitesse:</span>
                            <strong>${speed} kn</strong>
                        </div>
                        <div class="navire-detail">
                            <span>Cap:</span>
                            <strong>${course}°</strong>
                        </div>
                        <div class="navire-detail">
                            <span>Zone:</span>
                            <strong>${ship.zoneName}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        Logger.debug(`${ships.length} navires conformes affichés`);
    }

    /**
     * Affiche la liste des navires non-conformes
     * @param {Array} ships - Liste des navires non-conformes
     * @param {GdprService} gdprService - Service GDPR pour numérotation
     */
    renderNonConformes(ships, gdprService) {
        const section = document.getElementById('sectionNonConformes');
        const container = document.getElementById('listeNonConformes');
        const count = document.getElementById('nbNonConformes');

        if (!container || !count || !section) {
            Logger.warn('Éléments DOM pour navires non-conformes non trouvés');
            return;
        }

        count.textContent = ships.length;

        if (ships.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        container.innerHTML = ships.map(ship => {
            const shipNumber = gdprService.getShipNumber(ship.trackId);
            const distanceKm = (ship.distance / 1000).toFixed(2);
            const isMoving = ship.sog > 0.1;
            const isLandEmitter = ship.isLandEmitter;
            const isOnLand = !ship.isWater;

            // Déterminer la classe CSS selon le type
            let itemClass = 'navire-item navire-non-conforme';
            if (isLandEmitter) {
                itemClass += ' navire-terrestre';
            }

            // Déterminer la classe de distance selon la zone
            let distanceClass = 'distance-normal';
            if (ship.distance <= 1000) {
                distanceClass = 'distance-alerte';
            } else if (ship.distance <= 2000) {
                distanceClass = 'distance-vigilance';
            } else if (ship.distance <= 3000) {
                distanceClass = 'distance-approche';
            }

            // Construire le badge de tracking si le navire est en mouvement
            const trackingBadge = isMoving ? '<span class="badge-tracking">📍 EN MOUVEMENT</span>' : '';

            // Raisons de non-conformité
            let reasons = [];
            if (isOnLand) reasons.push('Sur terre');
            if (isLandEmitter) reasons.push('Émetteur terrestre');
            if (ship.sog < 0.1 && !isLandEmitter) reasons.push('Immobile');

            const reasonText = reasons.join(' • ');

            return `
                <div class="${itemClass}" onclick="window.TrackShipApp?.mapController?.centerOnShip('${ship.trackId}')">
                    <div class="navire-header">
                        <div class="navire-nom">
                            <span class="navire-numero">${shipNumber}</span>
                            ${ship.fairwayName || 'Inconnu'}
                            ${trackingBadge}
                        </div>
                        <span class="navire-distance ${distanceClass}">${distanceKm} km</span>
                    </div>
                    <div class="navire-details">
                        <div class="navire-detail">
                            <span>Vitesse:</span>
                            <strong>${ship.sog.toFixed(1)} kn</strong>
                        </div>
                        <div class="navire-detail">
                            <span>Raison:</span>
                            <strong style="color: #dc3545;">${reasonText}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        Logger.debug(`${ships.length} navires non-conformes affichés`);
    }

    /**
     * Affiche le panneau d'attention pour les navires en mouvement non-conformes
     * @param {Array} ships - Liste des navires en mouvement non-conformes
     * @param {GdprService} gdprService - Service GDPR pour numérotation
     */
    renderPanneauAttention(ships, gdprService) {
        const panneau = document.getElementById('panneauAttentionSidebar');
        const liste = document.getElementById('listeAttention');

        if (!panneau || !liste) {
            Logger.warn('Éléments DOM pour panneau d\'attention non trouvés');
            return;
        }

        // Filtrer seulement les navires en mouvement et non-conformes
        const movingNonConform = ships.filter(ship => ship.sog > 0.1 && (!ship.isWater || ship.isLandEmitter));

        if (movingNonConform.length === 0) {
            panneau.style.display = 'none';
            return;
        }

        panneau.style.display = 'block';

        liste.innerHTML = movingNonConform.map(ship => {
            const shipNumber = gdprService.getShipNumber(ship.trackId);
            const distanceKm = (ship.distance / 1000).toFixed(2);

            let reasons = [];
            if (!ship.isWater) reasons.push('Sur terre');
            if (ship.isLandEmitter) reasons.push('Émetteur terrestre');

            const reasonText = reasons.join(' • ');

            return `
                <div class="navire-panneau-sidebar" onclick="window.TrackShipApp?.mapController?.centerOnShip('${ship.trackId}')">
                    <div style="font-weight: bold;">
                        ${shipNumber} - ${distanceKm} km
                    </div>
                    <div style="font-size: 12px; margin-top: 5px; color: #dc3545;">
                        ${reasonText}
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">
                        Vitesse: ${ship.sog.toFixed(1)} kn • Cap: ${ship.cog.toFixed(0)}°
                    </div>
                </div>
            `;
        }).join('');

        Logger.info(`${movingNonConform.length} navires en mouvement non-conformes dans panneau d'attention`);
    }

    /**
     * Efface toutes les listes
     */
    clear() {
        const listeNavires = document.getElementById('listeNavires');
        const listeNonConformes = document.getElementById('listeNonConformes');
        const listeAttention = document.getElementById('listeAttention');
        const nbConformes = document.getElementById('nbConformes');
        const nbNonConformes = document.getElementById('nbNonConformes');
        const sectionNonConformes = document.getElementById('sectionNonConformes');
        const panneauAttention = document.getElementById('panneauAttentionSidebar');

        if (listeNavires) listeNavires.innerHTML = '<div class="loading">Aucun navire détecté</div>';
        if (listeNonConformes) listeNonConformes.innerHTML = '<div class="loading">Aucun navire</div>';
        if (listeAttention) listeAttention.innerHTML = '';
        if (nbConformes) nbConformes.textContent = '0';
        if (nbNonConformes) nbNonConformes.textContent = '0';
        if (sectionNonConformes) sectionNonConformes.style.display = 'none';
        if (panneauAttention) panneauAttention.style.display = 'none';

        Logger.debug('Listes de navires effacées');
    }
}
