# CONTEXTE PROJET - TrackShip MVC

## 🎯 Objectif
Surveillance temps réel des navires sur la Seine (zone Boulogne-Billancourt).
Version MVC refactorisée depuis index.html original (1912 lignes monolithiques).

## 📂 Architecture MVC

```
assets/js/
├── config.js              # Configuration centralisée
├── main.js                # Orchestrateur principal
├── models/                # ShipModel, CounterModel, ApiClient
├── views/                 # StatsView, ShipListView, CounterView, RefreshBadgeView, StatusBarView
├── controllers/           # ShipController, MapController, CounterController
├── services/              # ShipAnalysisService, GdprService, ZoneService, NotificationService
└── utils/                 # Logger, EventEmitter
```

## 🔑 Fonctionnalités Principales

### Surveillance
- Refresh 10s normal, 2s en alerte
- 3 zones: Alerte ≤1km, Vigilance 1-2km, Approche 2-3km
- Détection terre/eau (polygone Seine)
- Numérotation RGPD (N1, N2, N3...)

### Alertes
- 🔊 Alarme sonore 800 Hz quand navire ≤1km
- 🚨 Bannière rouge plein écran 10s
- Panneau attention orange (sidebar)
- Mode refresh accéléré

### Affichage
- 🚢 Flèches directionnelles (rotation selon cap)
- 📡 Icône antenne pour émetteurs terrestres
- Couleurs par zone (rouge/orange/vert)
- Logo Foil in Paris (base)

### Compteur
- Incrémentation auto zone rouge
- Historique multi-jours
- Stockage MySQL

## 🗄️ Base de Données

### Tables
1. **compteur_jours** - Compteur par jour
2. **bateaux_vus** - Historique détections
3. **bateaux_zone_rouge_actifs** - Temps réel zone rouge

### Configuration
```php
// Local (XAMPP)
DB: trackship
User: root
Pass: (vide)

// Production/Dev gérés par config/database.php
```

## 📡 API EuRIS

### Endpoint
```
GET /visuris/api/TracksV2/GetTracksByBBoxV2
?minLat=48.80&maxLat=48.90&minLon=2.15&maxLon=2.30&pageSize=100
Authorization: Bearer {TOKEN}
```

### Proxy Backend
`api/euris-proxy.php` normalise les données (trackID → trackId, lat/lon, sog/cog)

## ⚙️ Configuration Clés

```javascript
// Coordonnées base (FIXE)
BASE_COORDS: {lat: 48.853229, lon: 2.225328}

// Zones
ZONE_ALERTE: 1000m
ZONE_VIGILANCE: 2000m
ZONE_APPROCHE: 3000m

// Refresh
NORMAL: 10000ms
ALERTE: 2000ms

// RGPD
DUREE_RETENTION_NUMEROTATION: 86400000 (24h)
```

## 🔧 Corrections Appliquées

4 fonctionnalités critiques restaurées (commit fa3b037):

1. ✅ **Alarme sonore** - `NotificationService.playAlarm()`
2. ✅ **Bannière alerte** - `NotificationService.showRedAlertBanner()`
3. ✅ **Icône antenne** - `MapController.createShipMarker()` (📡 si terrestre)
4. ✅ **Règles conformité** - `ShipAnalysisService.isShipConform()` (nom + MMSI ≥6)

## 📁 Fichiers Importants

### Version Originale
- `index.html` - Version monolithique (branche main)

### Version MVC
- `index-mvc-CORRECT.html` - Point d'entrée (branche mvc-refactor)
- `assets/js/main.js` - Orchestration
- `api/euris-proxy.php` - Proxy API
- `config/database.php` - Config BDD multi-env

### Scripts
- `api/init-database.sql` - Structure BDD

## 🐛 Debug

### Console Navigateur
- Logger.js avec niveaux (info, warn, error, debug)
- Filtrer par mot-clé

### Test Alarme
```javascript
NotificationService.playAlarm();
```

### Test Bannière
```javascript
const ship = {fairwayName: 'Test', lat: 48.85, lon: 2.22};
const analysis = {distance: 500, speed: 8.5, course: 135};
NotificationService.showRedAlertBanner(ship, analysis, 'N1');
```

## 📊 Statut

**Version actuelle:** MVC refactorée fonctionnelle
**Branche:** mvc-refactor
**Dernier commit:** fa3b037 - Corrections fonctionnalités critiques

---

Dernière mise à jour: 2025-12-08
