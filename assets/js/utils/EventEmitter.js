// assets/js/utils/EventEmitter.js
// Bus d'événements simple pour la communication entre modules

export class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Écoute un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Écoute un événement une seule fois
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler
     */
    once(event, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }

    /**
     * Arrête d'écouter un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à retirer
     */
    off(event, callback) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Émet un événement
     * @param {string} event - Nom de l'événement
     * @param {...any} args - Arguments à passer aux callbacks
     */
    emit(event, ...args) {
        if (!this.events[event]) return;

        this.events[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Erreur dans le listener de l'événement "${event}":`, error);
            }
        });
    }

    /**
     * Supprime tous les listeners d'un événement
     * @param {string} event - Nom de l'événement
     */
    removeAllListeners(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }

    /**
     * Retourne le nombre de listeners pour un événement
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}

// Instance globale pour l'application
export const globalEventBus = new EventEmitter();
