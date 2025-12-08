# GUIDE RAPIDE - TrackShip MVC

## 🎯 VUE D'ENSEMBLE

Système de surveillance de navires en temps réel pour la Seine (zone Boulogne-Billancourt).
Architecture MVC refactorisée avec toutes les fonctionnalités de l'original.

---

## 📂 STRUCTURE DU PROJET

```
TrackShip_API/
├── api/
│   ├── euris-proxy.php         # Proxy API EuRIS (trackID)
│   ├── compteur.php            # API compteur MySQL
│   └── init-database.sql       # Structure BDD
├── assets/
│   ├── js/
│   │   ├── config.js           # Configuration centralisée
│   │   ├── main.js             # Orchestrateur principal
│   │   ├── models/             # ShipModel, CounterModel, ApiClient
│   │   ├── views/              # StatsView, ShipListView, CounterView, etc.
│   │   ├── controllers/        # ShipController, MapController, CounterController
│   │   ├── services/           # ShipAnalysisService, GdprService, ZoneService, NotificationService
│   │   └── utils/              # Logger, EventEmitter
│   └── style.css               # CSS original (inchangé)
├── config/
│   └── database.php            # Config BDD multi-env (local/dev/prod)
├── index.html                  # VERSION ORIGINALE (branche main)
├── index-mvc-CORRECT.html      # VERSION MVC (branche mvc-refactor)
└── .notes/                     # Documentation technique
```

---

## 🔑 FONCTIONNALITÉS CLÉS

### Surveillance Automatique
- Refresh 10s normal, 2s en alerte
- 3 zones concentriques (Alerte ≤1km, Vigilance 1-2km, Approche 2-3km)
- Détection terre/eau (polygone Seine)
- Numérotation RGPD (N1, N2, N3...)

### Alertes
- 🔊 **Alarme sonore** (800 Hz, 0.5s) quand navire ≤1km
- 🚨 **Bannière rouge** plein écran avec infos navire
- Panneau d'attention orange (sidebar)
- Mode actualisation accéléré (2s)

### Affichage Carte
- 🚢 **Flèches directionnelles** (rotation selon cap)
- 📡 **Icône antenne** pour émetteurs terrestres
- Couleurs selon zone (rouge/orange/vert)
- Logo Foil in Paris (base)

### Compteur Journalier
- Incrémentation auto zone rouge (≤1km)
- Historique multi-jours
- Cumul total
- Stockage MySQL

### Conformité RGPD
- Numérotation anonyme (pas de MMSI affiché)
- Nettoyage 24h
- Pas de sauvegarde noms de navires

---

## 🌐 DÉPLOIEMENT

### Branches Git
- **main** → trackship.bakabi.fr (version originale)
- **mvc-refactor** → devtrackship.bakabi.fr (version MVC)

### Bases de Données
- **Production:** `u411940699_trackship` (à créer)
- **Développement:** `u411940699_devtrackship` ✓
- **Local:** `trackship`

### Variables d'Environnement
```bash
# Production
SetEnv APP_ENV production

# Développement
SetEnv APP_ENV development

# Local (auto-détecté)
APP_ENV=local
```

---

## 🔧 CONFIG HOSTINGER

### Étapes Déploiement
1. Créer sous-domaines (trackship + devtrackship)
2. Créer BDD + users MySQL
3. Cloner repo Git (2 dossiers, 2 branches)
4. Copier .htaccess appropriés
5. Configurer database.php
6. Importer init-database.sql

### Identifiants Dev
- BDD: `u411940699_devtrackship`
- User: `u411940699_ghostdev`
- Pass: `$t1B97ydK`
- Site: https://devtrackship.bakabi.fr

Voir: `.notes/hostinger-next-steps.txt` pour détails complets

---

## 🐛 CORRECTIONS APPLIQUÉES

4 fonctionnalités critiques restaurées (voir `.notes/corrections-fonctionnalites-critiques.md`):

1. ✅ **Alarme sonore** - NotificationService.playAlarm()
2. ✅ **Bannière alerte** - NotificationService.showRedAlertBanner()
3. ✅ **Icône antenne** - MapController.createShipMarker() (📡 si terrestre)
4. ✅ **Règles conformité** - ShipAnalysisService.isShipConform() (nom + MMSI)

---

## 📋 API EURIS

### Endpoint
```
GET https://www.eurisportal.eu/visuris/api/TracksV2/GetTracksByBBoxV2
?minLat=48.80&maxLat=48.90&minLon=2.15&maxLon=2.30&pageSize=100
Authorization: Bearer {TOKEN}
```

### Réponse (Array direct)
```json
[
  {
    "trackID": "7000012345",
    "name": "BARGE XYZ",
    "lat": 48.853229,
    "lon": 2.225328,
    "sog": 8.5,
    "cog": 135,
    "moving": true,
    "st": 1,
    "inlen": 85.0,
    "inbm": 11.4,
    "positionISRS": "FR012345",
    "posTS": "2025-12-08T10:30:00Z"
  }
]
```

### Normalisation Backend (euris-proxy.php)
```php
'trackId' => $track['trackID'],
'latitude' => floatval($track['lat']),
'longitude' => floatval($track['lon']),
'speed' => floatval($track['sog']),
'course' => floatval($track['cog']),
'name' => $track['name'] ?? "Track {$trackId}",
'shipName' => $track['name'],
'moving' => $track['moving'] ?? null,
'length' => floatval($track['inlen']),
'width' => floatval($track['inbm'])
```

---

## 🗄️ STRUCTURE BDD

### Table: `compteur_jours`
- `numero_jour` (PK, AUTO_INCREMENT)
- `date_jour` (DATE, UNIQUE)
- `compteur_passages` (INT)

### Table: `bateaux_vus`
- `id` (PK, AUTO_INCREMENT)
- `numero_jour` (FK → compteur_jours)
- `track_id` (VARCHAR 50)
- `premiere_detection` (TIMESTAMP)
- UNIQUE (numero_jour, track_id)

### Table: `bateaux_zone_rouge_actifs`
- `id` (PK, AUTO_INCREMENT)
- `numero_jour` (FK → compteur_jours)
- `track_id` (VARCHAR 50)
- `entree_zone` (TIMESTAMP)
- `derniere_maj` (TIMESTAMP)
- UNIQUE (numero_jour, track_id)

---

## 🧪 TESTS RAPIDES

### Test Alarme
```javascript
// Console navigateur
NotificationService.playAlarm();
// → Son 800 Hz pendant 0.5s
```

### Test Bannière
```javascript
const fakeShip = {fairwayName: 'Test', lat: 48.85, lon: 2.22};
const fakeAnalysis = {distance: 500, speed: 8.5, course: 135};
NotificationService.showRedAlertBanner(fakeShip, fakeAnalysis, 'N1');
// → Bannière rouge 10s
```

### Test Conformité
```javascript
const ship1 = {fairwayName: 'BARGE', mmsi: '7000012345'};
ShipAnalysisService.isShipConform(ship1, true, false);
// → true (a nom + MMSI)

const ship2 = {fairwayName: '', mmsi: '123'};
ShipAnalysisService.isShipConform(ship2, true, false);
// → false (pas de nom, MMSI court)
```

---

## 📞 COMMANDES GIT

### Travailler sur MVC (dev)
```bash
git checkout mvc-refactor
git add .
git commit -m "Description"
git push origin mvc-refactor
```

### Merger vers production
```bash
git checkout main
git merge mvc-refactor
git push origin main
```

### Déployer sur Hostinger
```bash
ssh u411940699@trackship.bakabi.fr
cd ~/public_html/devtrackship
git pull origin mvc-refactor
```

---

## 🔍 DEBUGGING

### Logs Frontend
- Ouvrir Console navigateur (F12)
- Rechercher `Logger.js` messages
- Filtrer par niveau: info, warn, error, debug

### Logs Backend
```bash
tail -f /home/username/logs/php_errors_dev.log
```

### Test API Direct
```bash
curl -H "Authorization: Bearer {TOKEN}" \
"http://localhost/TrackShip_API/api/euris-proxy.php?minLat=48.80&maxLat=48.90&minLon=2.15&maxLon=2.30&pageSize=10"
```

---

## 📚 DOCUMENTS IMPORTANTS

- `.notes/corrections-fonctionnalites-critiques.md` - Détails corrections
- `.notes/hostinger-next-steps.txt` - Checklist déploiement
- `.notes/strategie-bdd-separation.txt` - Séparation prod/dev
- `.notes/deployment-strategy.txt` - Stratégie branches

---

## ⚙️ CONFIGURATION

### Coordonnées Base
```javascript
lat: 48.853229
lon: 2.225328
// Boulogne-Billancourt (FIXE, ne pas modifier)
```

### Zones
```javascript
ZONE_ALERTE: 1000m    // Rouge
ZONE_VIGILANCE: 2000m // Orange
ZONE_APPROCHE: 3000m  // Vert
```

### Refresh
```javascript
NORMAL: 10000ms  (10s)
ALERTE: 2000ms   (2s)
```

### RGPD
```javascript
DUREE_RETENTION_NUMEROTATION: 86400000 (24h)
```

---

## 🎨 DESIGN

### Couleurs Zones
- Rouge (#dc3545) - Alerte ≤1km
- Orange (#ff8800) - Vigilance 1-2km
- Vert (#28a745) - Approche 2-3km

### Icônes
- 🚢 Navire (flèche SVG rotative)
- 📡 Émetteur terrestre (emoji)
- 📍 Base (logo Foil in Paris - assets/1.png)

---

Dernière mise à jour: 2025-12-08
Version: MVC Refactor avec corrections critiques
