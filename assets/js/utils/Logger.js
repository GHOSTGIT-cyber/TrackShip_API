// assets/js/utils/Logger.js
// Utilitaire de logging

export class Logger {
    static isDebugMode = true; // Activer/désactiver les logs

    /**
     * Log d'information
     * @param {string} message
     * @param {...any} args
     */
    static info(message, ...args) {
        if (this.isDebugMode) {
            console.log(`ℹ️ [INFO] ${message}`, ...args);
        }
    }

    /**
     * Log de débogage
     * @param {string} message
     * @param {...any} args
     */
    static debug(message, ...args) {
        if (this.isDebugMode) {
            console.debug(`🐛 [DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Log d'avertissement
     * @param {string} message
     * @param {...any} args
     */
    static warn(message, ...args) {
        console.warn(`⚠️ [WARN] ${message}`, ...args);
    }

    /**
     * Log d'erreur
     * @param {string} message
     * @param {...any} args
     */
    static error(message, ...args) {
        console.error(`❌ [ERROR] ${message}`, ...args);
    }

    /**
     * Log de succès
     * @param {string} message
     * @param {...any} args
     */
    static success(message, ...args) {
        if (this.isDebugMode) {
            console.log(`✅ [SUCCESS] ${message}`, ...args);
        }
    }

    /**
     * Log groupé
     * @param {string} title
     * @param {Function} callback
     */
    static group(title, callback) {
        if (this.isDebugMode) {
            console.group(title);
            callback();
            console.groupEnd();
        }
    }

    /**
     * Log d'une table
     * @param {Array|Object} data
     */
    static table(data) {
        if (this.isDebugMode) {
            console.table(data);
        }
    }

    /**
     * Mesure de performance
     * @param {string} label
     */
    static time(label) {
        if (this.isDebugMode) {
            console.time(label);
        }
    }

    /**
     * Fin de mesure de performance
     * @param {string} label
     */
    static timeEnd(label) {
        if (this.isDebugMode) {
            console.timeEnd(label);
        }
    }

    /**
     * Active le mode debug
     */
    static enableDebug() {
        this.isDebugMode = true;
    }

    /**
     * Désactive le mode debug
     */
    static disableDebug() {
        this.isDebugMode = false;
    }
}
