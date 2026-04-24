// assets/js/utils/DateFormatter.js
// Utilitaires de formatage des dates

export class DateFormatter {
    /**
     * Formate une date en français (format long)
     * @param {string} dateString - Date au format SQL (YYYY-MM-DD)
     * @returns {string} - ex: "8 décembre 2025"
     */
    static formatLong(dateString) {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }

    /**
     * Formate une date en français (format court)
     * @param {string} dateString - Date au format SQL (YYYY-MM-DD)
     * @returns {string} - ex: "08/12"
     */
    static formatShort(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit' };
        return date.toLocaleDateString('fr-FR', options);
    }

    /**
     * Formate une date en français (format moyen)
     * @param {string} dateString - Date au format SQL (YYYY-MM-DD)
     * @returns {string} - ex: "08/12/2025"
     */
    static formatMedium(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }
}
