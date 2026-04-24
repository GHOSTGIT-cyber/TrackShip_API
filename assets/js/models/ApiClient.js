// assets/js/models/ApiClient.js
// Client HTTP unifié pour les appels API

import { CONFIG } from '../config.js';

export class ApiClient {
    constructor(baseUrl = CONFIG.API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Effectue une requête GET
     * @param {string} endpoint - Point de terminaison de l'API
     * @param {Object} params - Paramètres de la requête
     * @returns {Promise<Object>} Réponse JSON de l'API
     */
    async get(endpoint, params = {}) {
        const url = this.buildUrl(endpoint, params);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('GET request failed:', error);
            throw new Error(`${CONFIG.MESSAGES.ERROR_API}: ${error.message}`);
        }
    }

    /**
     * Effectue une requête POST
     * @param {string} endpoint - Point de terminaison de l'API
     * @param {Object} body - Corps de la requête
     * @param {Object} params - Paramètres URL
     * @returns {Promise<Object>} Réponse JSON de l'API
     */
    async post(endpoint, body = {}, params = {}) {
        const url = this.buildUrl(endpoint, params);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('POST request failed:', error);
            throw new Error(`${CONFIG.MESSAGES.ERROR_API}: ${error.message}`);
        }
    }

    /**
     * Construit l'URL complète avec paramètres
     * @param {string} endpoint
     * @param {Object} params
     * @returns {string} URL complète
     */
    buildUrl(endpoint, params = {}) {
        // Construction de l'URL complète - enlever slash si endpoint commence déjà par /
        let fullUrl = endpoint.startsWith('/') ? this.baseUrl + endpoint : this.baseUrl + '/' + endpoint;

        // Si pas de paramètres, retourner directement
        if (Object.keys(params).length === 0) {
            return fullUrl;
        }

        // Ajouter les paramètres
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });

        return fullUrl + '?' + queryParams.toString();
    }

    /**
     * Gère la réponse HTTP
     * @param {Response} response - Réponse fetch
     * @returns {Promise<Object>} Données JSON
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `HTTP Error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        return data;
    }

    /**
     * Effectue une requête avec token Bearer
     * @param {string} endpoint
     * @param {string} token
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    async getWithToken(endpoint, token, params = {}) {
        const url = this.buildUrl(endpoint, params);

        console.log('🌐 URL:', url);
        console.log('🔐 Auth Header:', token ? `Bearer ${token.substring(0, 20)}...` : 'ABSENT');

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('GET with token failed:', error);
            throw new Error(`${CONFIG.MESSAGES.ERROR_API}: ${error.message}`);
        }
    }
}
