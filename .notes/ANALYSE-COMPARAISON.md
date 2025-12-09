# ANALYSE COMPARAISON - Ancien vs MVC

## 📊 Résumé Exécutif

Analyse exhaustive de **43 fonctions JavaScript** de l'ancien index.html (1912 lignes).
Comparaison fonction par fonction avec la version MVC.

**Résultat:** 28 OK (65%) | 9 Partiels (21%) | 6 Manquants (14%)

## ✅ Fonctionnalités Corrigées (4/7 critiques)

### 1. Alarme Sonore
**Fichier:** `assets/js/services/NotificationService.js:181-200`
**Méthode:** `playAlarm(frequency = 800, duration = 0.5)`
**Déclenchement:** Automatique via `main.js:handleRedZoneAlerts()`
**Technologie:** AudioContext + Oscillator

### 2. Bannière Alerte Rouge
**Fichier:** `assets/js/services/NotificationService.js:208-271`
**Méthode:** `showRedAlertBanner(ship, analysis, shipNumber)`
**Affichage:** Plein écran, 10s, animation pulse
**Contenu:** Nom, distance, vitesse, cap, numéro RGPD

### 3. Icône Antenne 📡
**Fichier:** `assets/js/controllers/MapController.js:133-170`
**Logique:** `if (isLandEmitter)` → emoji 📡, sinon flèche SVG
**Taille:** 28x28px vs 24x24px pour navires

### 4. Règles Conformité
**Fichier:** `assets/js/services/ShipAnalysisService.js:53-85`
**Règles:**
- Conforme = `hasName && hasMMSI` (MMSI ≥6 chiffres)
- Non-conforme en mouvement = `hasSpeed && (manqueNom || manqueMMSI || manqueLongueur)`

## ⚠️ Optimisations Non Implémentées (3/7)

### 5. Historique Vitesses
**Impact:** Numérotation potentiellement instable
**Ancien:** Map `historiqueVitesses` avec compteurs scans
**Règle:** 2 scans > 0.5 kn pour attribuer, délai grâce 2 scans avant retrait
**Dev estimé:** 2-3h

### 6. Numérotation Initiale Ordonnée
**Impact:** Ordre aléatoire au lieu de plus loin → plus près
**Ancien:** Tri distance décroissante, N1 = plus loin
**Dev estimé:** 1h

### 7. Nettoyage RGPD Spatial
**Impact:** Garde numéros 24h au lieu de retrait immédiat hors zone
**Ancien:** Nettoyage immédiat si sort de zone
**Dev estimé:** 1h

## 📋 Mapping Fonctions Clés

| Fonction Ancienne | Fichier MVC | Statut |
|-------------------|-------------|--------|
| `demarrerSurveillance()` | `main.js:startSurveillance()` | ✓ |
| `mettreAJourDonnees()` | `main.js:updateData()` | ✓ |
| `analyserNavire()` | `ShipAnalysisService.analyzeShip()` | ✓ |
| `estEmetteurTerrestre()` | `ShipAnalysisService.isLandEmitter()` | ✓ |
| `estSurEau()` | `ZoneService.isOnWater()` | ✓ |
| `calculerDistance()` | `ZoneService.calculateDistance()` | ✓ |
| `creerIconeDirectionnelle()` | `MapController.createShipMarker()` | ✓ Modifié |
| `declencherAlerteRouge()` | `NotificationService` + `main.js` | ✓ Ajouté |
| `obtenirNumeroNavire()` | `GdprService.getShipNumber()` | ✓ |
| `nettoyageRGPD()` | `GdprService.cleanup()` | ⚠ Différent |
| `estEnMouvementStabilise()` | `ShipAnalysisService.isStableMovement()` | ⚠ Simplifié |
| `numerotationInitiale()` | N/A | ✗ Absent |

## 🎯 Différences Clés

### Détection Mouvement
**Ancien:** Historique 3 dernières vitesses + compteurs scans
**MVC:** Simple seuil vitesse + optionnel positionHistory

### Conformité
**Ancien:** Critères stricts (nom, MMSI, longueur)
**MVC:** Conforme = nom + MMSI (corrigé)

### Numérotation
**Ancien:** Ordre distance décroissante au premier scan
**MVC:** Ordre aléatoire (ordre API)

### Nettoyage RGPD
**Ancien:** Immédiat si sort de zone
**MVC:** Timeout 24h

## 🧪 Tests Recommandés

1. Navire entre en zone ≤1km → Alarme 800 Hz + bannière
2. Émetteur terrestre → Icône 📡 sur carte
3. Navire sans nom/MMSI → Liste non-conformes
4. Navire sort de zone → Garde numéro 24h (MVC) vs retrait immédiat (ancien)

## 📁 Code Original Clé

### Alarme (index.html:1263-1278)
```javascript
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioContext.createOscillator();
oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
oscillator.start();
oscillator.stop(audioContext.currentTime + 0.5);
```

### Bannière (index.html:1236-1260)
```javascript
const banniere = document.createElement('div');
banniere.id = 'banniereAlerte';
banniere.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    background: #dc3545; color: white; padding: 15px;
    animation: pulse 1s infinite; z-index: 9999;
`;
banniere.innerHTML = `🚨 ALERTE ZONE 1KM 🚨 - Navire "${shipName}" en mouvement !`;
document.body.insertBefore(banniere, document.body.firstChild);
setTimeout(() => banniere.remove(), 10000);
```

### Icône Antenne (index.html:754, 772)
```javascript
${surTerre ? '📡' : '🚢'}
```

### Conformité (index.html:1052-1062)
```javascript
function estNavireConforme(navire) {
    const aNom = navire.shipName && navire.shipName.trim() !== '';
    const aMMSI = navire.mmsi && navire.mmsi.toString().length >= 6;
    return aNom && aMMSI;
}
```

## 🔄 Historique Commits

- **fa3b037** - Corrections 4 fonctionnalités critiques
- **422da3e** - Config BDD Hostinger
- **8f6df08** - Version MVC complète

---

Dernière mise à jour: 2025-12-08
