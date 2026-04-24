// assets/js/services/StorageService.js
// Abstraction du localStorage

export class StorageService {
    /**
     * Récupère une valeur du localStorage
     * @param {string} key - Clé de stockage
     * @param {*} defaultValue - Valeur par défaut si la clé n'existe pas
     * @returns {*} Valeur stockée ou valeur par défaut
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;

            // Tenter de parser le JSON
            try {
                return JSON.parse(item);
            } catch {
                // Si ce n'est pas du JSON, retourner la valeur brute
                return item;
            }
        } catch (error) {
            console.error(`Erreur lecture localStorage[${key}]:`, error);
            return defaultValue;
        }
    }

    /**
     * Stocke une valeur dans le localStorage
     * @param {string} key - Clé de stockage
     * @param {*} value - Valeur à stocker
     * @returns {boolean} true si succès, false sinon
     */
    static set(key, value) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, stringValue);
            return true;
        } catch (error) {
            console.error(`Erreur écriture localStorage[${key}]:`, error);
            return false;
        }
    }

    /**
     * Supprime une clé du localStorage
     * @param {string} key - Clé à supprimer
     * @returns {boolean} true si succès
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Erreur suppression localStorage[${key}]:`, error);
            return false;
        }
    }

    /**
     * Vide complètement le localStorage
     * @returns {boolean} true si succès
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Erreur clear localStorage:', error);
            return false;
        }
    }

    /**
     * Vérifie si une clé existe
     * @param {string} key
     * @returns {boolean}
     */
    static has(key) {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Retourne toutes les clés du localStorage
     * @returns {Array<string>}
     */
    static keys() {
        return Object.keys(localStorage);
    }

    /**
     * Retourne le nombre d'éléments stockés
     * @returns {number}
     */
    static length() {
        return localStorage.length;
    }
}
