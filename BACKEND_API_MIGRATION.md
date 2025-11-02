# Backend API - Gast-Daten Migration

## Endpoint: POST /api/migrate-guest-data

Migriert Gast-Daten eines neuen Users in die Datenbank.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "hydration": {
    "consumedMl": 1500,
    "goalMl": 2500,
    "remainingMl": 1000,
    "date": "2024-10-30"
  },
  "profile": {
    "weightKg": 70,
    "activityLevel": "MEDIUM",
    "climate": "NORMAL"
  },
  "history": [
    {
      "volumeMl": 300,
      "source": "GLASS",
      "timestamp": "2024-10-30T14:30:00.000Z"
    },
    {
      "volumeMl": 200,
      "source": "SIP",
      "timestamp": "2024-10-30T16:45:00.000Z"
    }
  ],
  "exportedAt": "2024-10-30T18:00:00.000Z"
}
```

### Response (Success)
```json
{
  "success": true,
  "migratedItems": {
    "hydration": true,
    "profile": true,
    "historyCount": 2
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Invalid data format"
}
```

---

## Datenstruktur Details

### ActivityLevel Enum
- `LOW` - Niedrige Aktivität (Bürojob, wenig Bewegung)
- `MEDIUM` - Mittlere Aktivität (gelegentlich Sport)
- `HIGH` - Hohe Aktivität (regelmäßig Sport, körperliche Arbeit)

### Climate Enum
- `NORMAL` - Normales Klima
- `HOT` - Heißes Klima (erhöhter Flüssigkeitsbedarf)

### Source Enum
- `SIP` - Kleiner Schluck (~50ml)
- `DOUBLE_SIP` - Doppelter Schluck (~100ml)
- `GLASS` - Glas Wasser (~250ml)

---

## Implementation Notes für Backend-Team

### 1. Authentifizierung
- **WICHTIG**: Validiere dass der User über ein gültiges JWT-Token authentifiziert ist
- Extrahiere die User-ID aus dem Token
- Stelle sicher, dass der User Zugriff auf diese Migration hat

### 2. Validierung
Validiere folgende Felder:

**Hydration (optional):**
- `consumedMl`: Zahl >= 0
- `goalMl`: Zahl >= 0
- `remainingMl`: Zahl (kann negativ sein wenn Ziel überschritten)
- `date`: ISO 8601 Datum-String

**Profile (optional):**
- `weightKg`: Zahl > 0
- `activityLevel`: Muss einer der Enum-Werte sein
- `climate`: Muss einer der Enum-Werte sein

**History (optional, kann leeres Array sein):**
- `volumeMl`: Zahl > 0
- `source`: Muss einer der Enum-Werte sein
- `timestamp`: ISO 8601 DateTime-String

### 3. Datenbank-Operationen

#### a) Profil Migration
```sql
-- Wenn Profile-Daten vorhanden:
INSERT INTO profiles (user_id, weight_kg, activity_level, climate, created_at, updated_at)
VALUES (?, ?, ?, ?, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  weight_kg = VALUES(weight_kg),
  activity_level = VALUES(activity_level),
  climate = VALUES(climate),
  updated_at = NOW();
```

#### b) Hydration Goal berechnen
Basierend auf dem migrierten Profil:
```
goalMl = (weightKg × 35) + activityBonus + climateBonus

Wobei:
- activityBonus:
  - LOW: 0 ml
  - MEDIUM: 250 ml
  - HIGH: 500 ml

- climateBonus:
  - NORMAL: 0 ml
  - HOT: 500 ml
```

#### c) History Migration
```sql
-- Für jeden Eintrag in history:
INSERT INTO intakes (user_id, volume_ml, source, timestamp, created_at)
VALUES (?, ?, ?, ?, NOW());
```

#### d) Hydration Summary erstellen/aktualisieren
```sql
-- Berechne consumed_ml aus migrierten Einträgen
INSERT INTO hydration_daily (user_id, date, consumed_ml, goal_ml, remaining_ml, created_at, updated_at)
SELECT
  ? as user_id,
  DATE(?) as date,
  COALESCE(SUM(volume_ml), 0) as consumed_ml,
  ? as goal_ml,
  ? - COALESCE(SUM(volume_ml), 0) as remaining_ml,
  NOW() as created_at,
  NOW() as updated_at
FROM intakes
WHERE user_id = ? AND DATE(timestamp) = DATE(?)
ON DUPLICATE KEY UPDATE
  consumed_ml = VALUES(consumed_ml),
  remaining_ml = VALUES(remaining_ml),
  updated_at = NOW();
```

### 4. Error Handling

**Mögliche Fehler:**
- `401 Unauthorized`: Kein gültiges JWT-Token
- `400 Bad Request`: Invalide Datenstruktur
- `409 Conflict`: Daten für diesen User existieren bereits
- `500 Internal Server Error`: Datenbank-Fehler

**Best Practice:**
- Bei Datenbank-Fehlern: Rollback der gesamten Transaction
- Logge alle Migrationsvorgänge für Debugging
- Sende detaillierte Fehlermeldungen im Development-Mode

### 5. Transaction Management

```pseudo
BEGIN TRANSACTION;

TRY:
  1. Validiere Request Body
  2. Lade User aus Token
  3. Erstelle/Update Profil (falls vorhanden)
  4. Berechne Goal basierend auf Profil
  5. Migriere History Einträge
  6. Erstelle/Update Daily Hydration Summary

  COMMIT;
  RETURN Success Response;

CATCH:
  ROLLBACK;
  LOG Error;
  RETURN Error Response;
```

### 6. Performance-Hinweise

- Verwende **Batch Inserts** für History-Einträge wenn möglich
- Nutze **Prepared Statements** um SQL-Injection zu verhindern
- Setze einen **Timeout** von max. 10 Sekunden
- **Rate Limiting**: Max. 1 Migration pro User

---

## Test Cases

### Test 1: Erfolgreiche Migration mit allen Daten
```bash
curl -X POST http://localhost:3000/api/migrate-guest-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hydration": {
      "consumedMl": 1500,
      "goalMl": 2500,
      "remainingMl": 1000,
      "date": "2024-10-30"
    },
    "profile": {
      "weightKg": 75,
      "activityLevel": "MEDIUM",
      "climate": "NORMAL"
    },
    "history": [
      {
        "volumeMl": 300,
        "source": "GLASS",
        "timestamp": "2024-10-30T10:30:00.000Z"
      },
      {
        "volumeMl": 200,
        "source": "SIP",
        "timestamp": "2024-10-30T14:15:00.000Z"
      }
    ],
    "exportedAt": "2024-10-30T18:00:00.000Z"
  }'
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "migratedItems": {
    "hydration": true,
    "profile": true,
    "historyCount": 2
  }
}
```

### Test 2: Migration nur mit Profil (keine History)
```bash
curl -X POST http://localhost:3000/api/migrate-guest-data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hydration": null,
    "profile": {
      "weightKg": 80,
      "activityLevel": "HIGH",
      "climate": "HOT"
    },
    "history": [],
    "exportedAt": "2024-10-30T18:00:00.000Z"
  }'
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "migratedItems": {
    "hydration": false,
    "profile": true,
    "historyCount": 0
  }
}
```

### Test 3: Migration ohne Authentication
```bash
curl -X POST http://localhost:3000/api/migrate-guest-data \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Erwartetes Ergebnis:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
**Status Code:** 401

---

## Deployment Checklist

- [ ] Migration-Endpoint implementiert
- [ ] Validierung für alle Felder vorhanden
- [ ] Transaction-Management implementiert
- [ ] Error-Handling vollständig
- [ ] Logging implementiert
- [ ] Unit-Tests geschrieben
- [ ] Integration-Tests durchgeführt
- [ ] API-Dokumentation aktualisiert
- [ ] Rate-Limiting konfiguriert
- [ ] Monitoring für Endpoint aktiviert

---

## Fragen & Support

Bei Fragen zur Frontend-Integration oder Problemen mit der API:
- Frontend-Team kontaktieren
- Issue im Repository erstellen
- Migration-Logs prüfen

**Hinweis**: Diese Migration ist optional - wenn sie fehlschlägt, sollte der User trotzdem erfolgreich registriert werden. Die Gast-Daten bleiben als Backup im LocalStorage.
