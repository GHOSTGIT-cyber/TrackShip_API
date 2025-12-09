// assets/js/services/NotificationService.js
// Gestion des notifications et alertes utilisateur

export class NotificationService {
    /**
     * Affiche une notification de succès
     * @param {string} message
     * @param {number} duration - Durée en ms (défaut: 3000)
     */
    static success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    /**
     * Affiche une notification d'erreur
     * @param {string} message
     * @param {number} duration - Durée en ms (défaut: 5000)
     */
    static error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    /**
     * Affiche une notification d'avertissement
     * @param {string} message
     * @param {number} duration - Durée en ms (défaut: 4000)
     */
    static warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    }

    /**
     * Affiche une notification d'information
     * @param {string} message
     * @param {number} duration - Durée en ms (défaut: 3000)
     */
    static info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    /**
     * Affiche une notification générique
     * @param {string} message
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Durée en ms
     */
    static show(message, type = 'info', duration = 3000) {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Ajouter au DOM
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Style de la notification
        notification.style.cssText = `
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            color: white;
            font-weight: bold;
            min-width: 250px;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        // Couleur selon le type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Auto-suppression après la durée spécifiée
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    notification.remove();
                    // Supprimer le container s'il est vide
                    if (container.children.length === 0) {
                        container.remove();
                    }
                }, 300);
            }, duration);
        }

        // Ajout du style CSS pour les animations (une seule fois)
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                .notification {
                    cursor: pointer;
                }
                .notification:hover {
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
        }

        // Permettre de fermer en cliquant
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        });
    }

    /**
     * Demande confirmation à l'utilisateur
     * @param {string} message
     * @returns {boolean}
     */
    static confirm(message) {
        return window.confirm(message);
    }

    /**
     * Demande une saisie utilisateur
     * @param {string} message
     * @param {string} defaultValue
     * @returns {string|null}
     */
    static prompt(message, defaultValue = '') {
        return window.prompt(message, defaultValue);
    }

    /**
     * Affiche une alerte simple
     * @param {string} message
     */
    static alert(message) {
        window.alert(message);
    }

    /**
     * Joue une alarme sonore
     * @param {number} frequency - Fréquence du son en Hz (défaut: 800)
     * @param {number} duration - Durée en secondes (défaut: 0.5)
     */
    static playAlarm(frequency = 800, duration = 0.5) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);

            console.log('🔊 Alarme sonore déclenchée');
        } catch (e) {
            console.warn('🔇 Alarme sonore non disponible:', e);
        }
    }

    /**
     * Affiche une bannière d'alerte rouge en haut de page
     * @param {Object} ship - Navire en alerte
     * @param {Object} analysis - Résultats d'analyse du navire
     * @param {string} shipNumber - Numéro RGPD du navire
     */
    static showRedAlertBanner(ship, analysis, shipNumber = null) {
        // Supprimer ancienne bannière si existe
        const existing = document.getElementById('banniereAlerte');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'banniereAlerte';
        banner.className = 'banniere-alerte';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #dc3545;
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            z-index: 9999;
            animation: pulse 1s infinite;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;

        const shipName = ship.fairwayName || ship.name || 'Inconnu';
        const distance = Math.round(analysis.distance);
        const speed = analysis.speed ? analysis.speed.toFixed(1) : 'N/A';
        const course = analysis.course ? Math.round(analysis.course) : 'N/A';
        const numberText = shipNumber ? `#${shipNumber} ` : '';

        banner.innerHTML = `
            🚨 ALERTE ZONE 1KM 🚨 - Navire ${numberText}"${shipName}" en mouvement !
            Distance: ${distance}m - Vitesse: ${speed} kn - Cap: ${course}°
        `;

        document.body.insertBefore(banner, document.body.firstChild);

        // Auto-suppression après 10 secondes
        setTimeout(() => {
            if (document.getElementById('banniereAlerte')) {
                banner.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => banner.remove(), 500);
            }
        }, 10000);

        // Ajouter animation CSS si pas déjà présent
        if (!document.getElementById('banner-animation')) {
            const style = document.createElement('style');
            style.id = 'banner-animation';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        console.log('🚨 Bannière d\'alerte rouge affichée pour:', shipName);
    }
}
