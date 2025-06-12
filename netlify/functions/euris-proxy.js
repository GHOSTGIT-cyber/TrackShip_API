// netlify/functions/euris-proxy.js
exports.handler = async (event, context) => {
    console.log('🚀 Démarrage du proxy EuRIS');
    console.log('📝 Méthode HTTP:', event.httpMethod);
    console.log('📝 Paramètres reçus:', event.queryStringParameters);

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    // Gestion des requêtes OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Requête OPTIONS (preflight) - Réponse CORS');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight OK' })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    // Vérification méthode GET
    if (event.httpMethod !== 'GET') {
        console.log('❌ Méthode HTTP non autorisée:', event.httpMethod);
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                error: 'Method Not Allowed',
                message: 'Seules les requêtes GET sont autorisées',
                allowedMethods: ['GET', 'OPTIONS']
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    // Récupération des paramètres
    const { minLat, maxLat, minLon, maxLon, pageSize = 100, token } = event.queryStringParameters || {};

    console.log('🔍 Validation des paramètres...');

    // Validation des paramètres obligatoires
    if (!minLat || !maxLat || !minLon || !maxLon || !token) {
        console.log('❌ Paramètres manquants');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Missing required parameters',
                message: 'Les paramètres minLat, maxLat, minLon, maxLon et token sont obligatoires',
                required: ['minLat', 'maxLat', 'minLon', 'maxLon', 'token'],
                received: event.queryStringParameters
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    // Validation des coordonnées
    const lat1 = parseFloat(minLat);
    const lat2 = parseFloat(maxLat);
    const lon1 = parseFloat(minLon);
    const lon2 = parseFloat(maxLon);

    if (isNaN(lat1) || isNaN(lat2) || isNaN(lon1) || isNaN(lon2)) {
        console.log('❌ Coordonnées invalides');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid coordinates',
                message: 'Les coordonnées doivent être des nombres valides',
                coordinates: { minLat, maxLat, minLon, maxLon }
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    // Validation des limites géographiques
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        console.log('❌ Latitude hors limites');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid latitude',
                message: 'La latitude doit être comprise entre -90 et 90 degrés'
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        console.log('❌ Longitude hors limites');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid longitude',
                message: 'La longitude doit être comprise entre -180 et 180 degrés'
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    // Validation de la taille de page
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 1000) {
        console.log('❌ Taille de page invalide');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid page size',
                message: 'La taille de page doit être un nombre entre 1 et 1000'
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE

    // Construction de l'URL EuRIS
    const eurisUrl = `https://www.eurisportal.eu/visuris/api/TracksV2/GetTracksByBBoxV2?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}&pageSize=${pageSize}`;
    
    console.log('🌐 URL EuRIS construite:', eurisUrl);
    console.log('🔑 Token fourni (masqué):', token.substring(0, 10) + '...');

    try {
        console.log('📡 Appel à l\'API EuRIS en cours...');
        
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Netlify-EuRIS-Proxy/2.0; Surveillance-Navires)',
                'Content-Type': 'application/json'
            }
        }; // ← ACCOLADE MANQUANTE AJOUTÉE

        const response = await fetch(eurisUrl, fetchOptions);
        
        console.log('📊 Réponse EuRIS - Status:', response.status);

        if (!response.ok) {
            let errorMessage = `EuRIS API error: ${response.status} ${response.statusText}`;
            
            switch (response.status) {
                case 401:
                    errorMessage = 'Token d\'authentification invalide ou expiré';
                    break;
                case 403:
                    errorMessage = 'Accès interdit - permissions insuffisantes';
                    break;
                case 404:
                    errorMessage = 'Endpoint API non trouvé';
                    break;
                case 429:
                    errorMessage = 'Limite de taux d\'appels dépassée';
                    break;
                case 500:
                    errorMessage = 'Erreur interne du serveur EuRIS';
                    break;
            } // ← ACCOLADE MANQUANTE AJOUTÉE

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: errorMessage,
                    httpStatus: response.status,
                    timestamp: new Date().toISOString()
                })
            };
        } // ← ACCOLADE MANQUANTE AJOUTÉE

        const data = await response.json();
        
        console.log('✅ Données EuRIS récupérées avec succès');
        console.log('📊 Nombre de tracks reçues:', data.tracks ? data.tracks.length : 0);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'appel EuRIS:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal proxy error',
                message: 'Erreur interne du proxy',
                details: error.message,
                timestamp: new Date().toISOString()
            })
        };
    } // ← ACCOLADE MANQUANTE AJOUTÉE
}; // ← ACCOLADE FINALE AJOUTÉE
