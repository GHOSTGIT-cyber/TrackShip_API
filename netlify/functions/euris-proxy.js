// netlify/functions/euris-proxy.js
exports.handler = async (event, context) => {
    console.log('🚀 Démarrage du proxy EuRIS');
    console.log('📝 Méthode HTTP:', event.httpMethod);
    console.log('📝 Paramètres reçus:', event.queryStringParameters);

    // Headers CORS pour toutes les réponses
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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

    // Vérification méthode GET uniquement
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

    // Récupération et validation des paramètres
    const params = event.queryStringParameters || {};
    const { minLat, maxLat, minLon, maxLon, pageSize = 100, token } = params;

    console.log('🔍 Validation des paramètres...');

    // Vérification des paramètres obligatoires
    if (!minLat || !maxLat || !minLon || !maxLon || !token) {
        console.log('❌ Paramètres manquants');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Missing required parameters',
                message: 'Les paramètres minLat, maxLat, minLon, maxLon et token sont obligatoires',
                required: ['minLat', 'maxLat', 'minLon', 'maxLon', 'token'],
                received: Object.keys(params)
            })
        };
    }

    // Validation et conversion des coordonnées
    const coordinates = {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLon: parseFloat(minLon),
        maxLon: parseFloat(maxLon)
    };

    // Vérification que les coordonnées sont des nombres valides
    for (const [key, value] of Object.entries(coordinates)) {
        if (isNaN(value)) {
            console.log(`❌ Coordonnée invalide: ${key} = ${params[key.replace('minLat', 'minLat').replace('maxLat', 'maxLat').replace('minLon', 'minLon').replace('maxLon', 'maxLon')]}`);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid coordinates',
                    message: `La coordonnée ${key} doit être un nombre valide`,
                    invalidValue: params[key],
                    coordinates: params
                })
            };
        }
    }

    // Validation des limites géographiques
    if (coordinates.minLat < -90 || coordinates.maxLat > 90 || coordinates.minLat > coordinates.maxLat) {
        console.log('❌ Latitude invalide');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid latitude range',
                message: 'Les latitudes doivent être entre -90 et 90, et minLat < maxLat',
                received: { minLat: coordinates.minLat, maxLat: coordinates.maxLat }
            })
        };
    }

    if (coordinates.minLon < -180 || coordinates.maxLon > 180 || coordinates.minLon > coordinates.maxLon) {
        console.log('❌ Longitude invalide');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid longitude range',
                message: 'Les longitudes doivent être entre -180 et 180, et minLon < maxLon',
                received: { minLon: coordinates.minLon, maxLon: coordinates.maxLon }
            })
        };
    }

    // Validation de la taille de page
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 1000) {
        console.log('❌ Taille de page invalide:', pageSize);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Invalid page size',
                message: 'La taille de page doit être un nombre entre 1 et 1000',
                received: pageSize
            })
        };
    }

    // Construction de l'URL EuRIS avec les coordonnées validées
    const eurisUrl = `https://www.eurisportal.eu/visuris/api/TracksV2/GetTracksByBBoxV2?minLat=${coordinates.minLat}&maxLat=${coordinates.maxLat}&minLon=${coordinates.minLon}&maxLon=${coordinates.maxLon}&pageSize=${pageSizeNum}`;
    
    console.log('🌐 URL EuRIS construite:', eurisUrl);
    console.log('🔑 Token fourni (premiers caractères):', token.substring(0, 10) + '...');

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
            // Timeout de 30 secondes
            timeout: 30000
        };

        // Appel à l'API EuRIS
        const response = await fetch(eurisUrl, fetchOptions);
        
        console.log('📊 Réponse EuRIS - Status:', response.status);
        console.log('📊 Réponse EuRIS - Headers:', Object.fromEntries(response.headers));

        // Gestion des erreurs HTTP
        if (!response.ok) {
            let errorMessage = `EuRIS API error: ${response.status} ${response.statusText}`;
            let errorDetails = '';
            
            // Messages d'erreur spécifiques selon le code de statut
            switch (response.status) {
                case 401:
                    errorMessage = 'Token d\'authentification invalide ou expiré';
                    errorDetails = 'Vérifiez que votre token EuRIS est valide et non expiré';
                    break;
                case 403:
                    errorMessage = 'Accès interdit - permissions insuffisantes';
                    errorDetails = 'Votre token n\'a pas les permissions nécessaires pour accéder à cette ressource';
                    break;
                case 404:
                    errorMessage = 'Endpoint API non trouvé';
                    errorDetails = 'L\'URL de l\'API EuRIS semble incorrecte ou l\'endpoint n\'existe plus';
                    break;
                case 429:
                    errorMessage = 'Limite de taux d\'appels dépassée';
                    errorDetails = 'Trop de requêtes envoyées. Attendez avant de réessayer';
                    break;
                case 500:
                    errorMessage = 'Erreur interne du serveur EuRIS';
                    errorDetails = 'Le serveur EuRIS rencontre un problème technique';
                    break;
                case 502:
                case 503:
                case 504:
                    errorMessage = 'Service EuRIS temporairement indisponible';
                    errorDetails = 'Le service EuRIS est en maintenance ou surchargé';
                    break;
                default:
                    errorDetails = 'Erreur inconnue de l\'API EuRIS';
            }

            // Tentative de récupération du message d'erreur détaillé
            let apiErrorDetails = null;
            try {
                const errorText = await response.text();
                apiErrorDetails = errorText;
            } catch (e) {
                console.log('Impossible de lire le corps de la réponse d\'erreur');
            }

            console.log('❌ Erreur API EuRIS:', errorMessage);
            if (apiErrorDetails) {
                console.log('❌ Détails de l\'erreur API:', apiErrorDetails);
            }

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: errorMessage,
                    details: errorDetails,
                    httpStatus: response.status,
                    apiResponse: apiErrorDetails,
                    timestamp: new Date().toISOString(),
                    requestUrl: eurisUrl.replace(token, '[TOKEN_HIDDEN]')
                })
            };
        }

        // Parsing de la réponse JSON
        const data = await response.json();
        
        console.log('✅ Données EuRIS récupérées avec succès');
        console.log('📊 Nombre de tracks reçues:', data.tracks ? data.tracks.length : 0);
        console.log('📊 Structure des données:', Object.keys(data));

        // Validation de la structure des données reçues
        if (!data.tracks) {
            console.log('⚠️ Aucune propriété "tracks" dans la réponse');
        }

        // Retour des données avec informations additionnelles
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...data,
                _metadata: {
                    timestamp: new Date().toISOString(),
                    source: 'EuRIS API via Netlify Proxy',
                    trackCount: data.tracks ? data.tracks.length : 0,
                    requestParams: {
                        bbox: coordinates,
                        pageSize: pageSizeNum
                    }
                }
            })
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'appel EuRIS:', error);
        
        // Gestion des différents types d'erreurs
        let errorType = 'Unknown error';
        let errorMessage = error.message;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorType = 'Network error';
            errorMessage = 'Impossible de contacter l\'API EuRIS. Vérifiez votre connexion internet.';
        } else if (error.name === 'SyntaxError') {
            errorType = 'JSON parsing error';
            errorMessage = 'La réponse de l\'API EuRIS n\'est pas au format JSON valide.';
        } else if (error.code === 'ENOTFOUND') {
            errorType = 'DNS error';
            errorMessage = 'Impossible de résoudre le nom de domaine de l\'API EuRIS.';
        } else if (error.code === 'ECONNREFUSED') {
            errorType = 'Connection refused';
            errorMessage = 'La connexion à l\'API EuRIS a été refusée.';
        } else if (error.code === 'ETIMEDOUT') {
            errorType = 'Timeout error';
            errorMessage = 'L\'API EuRIS a mis trop de temps à répondre.';
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal proxy error',
                type: errorType,
                message: errorMessage,
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                requestUrl: eurisUrl.replace(token, '[TOKEN_HIDDEN]')
            })
        };
    }
};