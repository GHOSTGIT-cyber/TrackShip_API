// netlify/functions/euris-proxy.js
// Fonction serverless Netlify pour proxy EuRIS avec gestion avancée des erreurs et logging

exports.handler = async (event, context) => {
    console.log('🚀 Démarrage du proxy EuRIS');
    console.log('📝 Méthode HTTP:', event.httpMethod);
    console.log('📝 Paramètres reçus:', event.queryStringParameters);

    // Configuration des headers CORS pour permettre les requêtes cross-origin
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Pas de cache pour des données temps réel
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    // Gestion des requêtes OPTIONS (preflight CORS)
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Requête OPTIONS (preflight) - Réponse CORS');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight OK' })
        };
    }

    // Vérification que c'est une requête GET
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
    }

    // Récupération et validation des paramètres de la requête
    const { 
        minLat, 
        maxLat, 
        minLon, 
        maxLon, 
        pageSize = 100, 
        token 
    } = event.queryStringParameters || {};

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
    }

    // Validation des coordonnées géographiques
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
    }

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
    }

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
    }

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
    }

    // Construction de l'URL de l'API EuRIS
    const eurisUrl = `https://www.eurisportal.eu/visuris/api/TracksV2/GetTracksByBBoxV2?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}&pageSize=${pageSize}`;
    
    console.log('🌐 URL EuRIS construite:', eurisUrl);
    console.log('🔑 Token fourni (masqué):', token.substring(0, 10) + '...');

    try {
        console.log('📡 Appel à l\'API EuRIS en cours...');
        
        // Configuration de la requête vers EuRIS
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Netlify-EuRIS-Proxy/2.0; Surveillance-Navires)',
                'Content-Type': 'application/json'
            },
            // Timeout de 30 secondes pour éviter les blocages
            signal: AbortSignal.timeout(30000)
        };

        // Appel à l'API EuRIS
        const response = await fetch(eurisUrl, fetchOptions);
        
        console.log('📊 Réponse EuRIS - Status:', response.status);
        console.log('📊 Réponse EuRIS - Headers:', Object.fromEntries(response.headers.entries()));

        // Gestion des différents codes d'erreur HTTP
        if (!response.ok) {
            let errorMessage = `EuRIS API error: ${response.status} ${response.statusText}`;
            let errorDetails = {};

            // Tentative de récupération du message d'erreur détaillé
            try {
                const errorData = await response.text();
                console.log('❌ Détails erreur EuRIS:', errorData);
                errorDetails.details = errorData;
            } catch (e) {
                console.log('⚠️ Impossible de lire les détails de l\'erreur');
            }

            // Messages d'erreur spécifiques selon le code HTTP
            switch (response.status) {
                case 401:
                    errorMessage = 'Token d\'authentification invalide ou expiré';
                    errorDetails.solution = 'Vérifiez votre token EuRIS et sa validité';
                    break;
                case 403:
                    errorMessage = 'Accès interdit - permissions insuffisantes';
                    errorDetails.solution = 'Vérifiez les permissions de votre token EuRIS';
                    break;
                case 404:
                    errorMessage = 'Endpoint API non trouvé';
                    errorDetails.solution = 'Vérifiez l\'URL de l\'API EuRIS';
                    break;
                case 429:
                    errorMessage = 'Limite de taux d\'appels dépassée';
                    errorDetails.solution = 'Attendez avant de refaire une requête';
                    break;
                case 500:
                    errorMessage = 'Erreur interne du serveur EuRIS';
                    errorDetails.solution = 'Réessayez plus tard';
                    break;
            }

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: errorMessage,
                    httpStatus: response.status,
                    timestamp: new Date().toISOString(),
                    requestUrl: eurisUrl.replace(token, '[TOKEN_MASKED]'),
                    ...errorDetails
                })
            };
        }

        // Récupération et parsing des données JSON
        const data = await response.json();
        
        console.log('✅ Données EuRIS récupérées avec succès');
        console.log('📊 Nombre de tracks reçues:', data.tracks ? data.tracks.length : 0);

        // Enrichissement des données avec des métadonnées
        const enrichedData = {
            ...data,
            metadata: {
                timestamp: new Date().toISOString(),
                requestBounds: {
                    minLat: parseFloat(minLat),
                    maxLat: parseFloat(maxLat),
                    minLon: parseFloat(minLon),
                    maxLon: parseFloat(maxLon)
                },
                pageSize: pageSizeNum,
                totalTracks: data.tracks ? data.tracks.length : 0,
                proxyVersion: '2.0'
            }
        };

        // Logging des statistiques pour le monitoring
        if (data.tracks && data.tracks.length > 0) {
            console.log('📈 Statistiques des navires:');
            console.log('   - Total:', data.tracks.length);
            
            // Calcul de statistiques basiques
            const vitesses = data.tracks.filter(t => t.speed).map(t => t.speed);
            if (vitesses.length > 0) {
                const vitesseMoyenne = vitesses.reduce((a, b) => a + b, 0) / vitesses.length;
                console.log('   - Vitesse moyenne:', vitesseMoyenne.toFixed(2), 'kn');
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(enrichedData)
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'appel EuRIS:', error);

        // Gestion spécifique des erreurs de timeout
        if (error.name === 'AbortError') {
            return {
                statusCode: 504,
                headers,
                body: JSON.stringify({
                    error: 'Request timeout',
                    message: 'L\'API EuRIS n\'a pas répondu dans les temps (30s)',
                    timestamp: new Date().toISOString(),
                    suggestion: 'Réessayez avec une zone plus petite ou plus tard'
                })
            };
        }

        // Gestion des erreurs réseau
        if (error.message.includes('fetch')) {
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({
                    error: 'Network error',
                    message: 'Impossible de contacter l\'API EuRIS',
                    details: error.message,
                    timestamp: new Date().toISOString(),
                    suggestion: 'Vérifiez votre connexion internet et réessayez'
                })
            };
        }

        // Erreur générique
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal proxy error',
                message: 'Erreur interne du proxy',
                details: error.message,
                timestamp: new Date().toISOString(),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
