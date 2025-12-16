# HydrateMate

> Dein persönlicher Trink-Tracker 

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)
![Frontend Tests](https://github.com/Dorian509/FrontEnd/workflows/Frontend%20CI/badge.svg)

## Inhaltsverzeichnis

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Development](#-development)
- [Projekt-Struktur](#-projekt-struktur)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)

## Features

### Dual-Mode System

#### Gast-Modus
- ✅ Sofortiger Zugriff ohne Registrierung
- ✅ Vollständige Tracking-Funktionen
- ✅ Daten in LocalStorage (gerätelokal)
- ✅ Upgrade zu User-Account jederzeit möglich
- ✅ Daten-Migration beim Upgrade

#### User-Modus
- ✅ Persistente Speicherung in PostgreSQL
- ✅ Multi-Device Synchronisation
- ✅ Langzeit-Statistiken
- ✅ Cloud-Backup der Daten
- ✅ Account-Management

### Hauptfunktionen

#### Dashboard
- **Tagesfortschritt**: Visueller Progress-Bar mit Prozentanzeige
- **Quick-Add Buttons**: Schnelles Hinzufügen (50ml / 100ml / 250ml)
- **Heute getrunken**: Chronologische Liste aller heutigen Einträge
- **Streak-Tracking**: Aktuelle und längste Serie
- **Profil-Übersicht**: Gewicht, Aktivität, Ziel

#### Statistiken
- **7-Tage Chart**: Visualisierung mit Chart.js
- **Durchschnittswerte**: Konsum und Zielerreichung
- **Erfolgsrate**: Prozentsatz erreichter Tage
- **Gesamt-Statistiken**: Lifetime Tracking

#### Verlauf
- **Chronologische Übersicht**: Alle Einträge sortiert
- **Gruppierung nach Datum**: "Heute", "Gestern", Wochentag
- **Detailansicht**: Uhrzeit, Quelle, Menge
- **Löschen-Funktion**: Einzelne Einträge entfernen

#### Einstellungen
- **Profil-Anpassung**: Gewicht (30-200kg Slider)
- **Aktivitätslevel**: Niedrig / Mittel (+250ml) / Hoch (+500ml)
- **Klimabedingungen**: Normal / Heiß (+500ml)
- **Ziel-Berechnung**: Automatisch basierend auf Profil
- **Formel**: `Gewicht × 35ml + Aktivität + Klima`

### UI/UX Features
- **Gaming-Design**: Dunkles Theme mit Neon-Akzenten
- **Responsive**: Mobile-first Design
- **Animationen**: Smooth Transitions und Hover-Effekte
- **Toast-Notifications**: Erfolgs- und Error-Meldungen
- **Loading States**: Spinner und Skeleton-Screens
- **Font Awesome Icons**: 500+ Icons

### Frontend
- **Framework**: Vue 3.5 (Composition API)
- **Language**: TypeScript 5.6 (Strict Mode)
- **Styling**: Tailwind CSS 4.0
- **Icons**: Font Awesome 6
- **Build Tool**: Vite 7.1
- **Router**: Vue Router 4
- **Charts**: Chart.js 4
- **HTTP**: Native Fetch API

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Database**: PostgreSQL 17 (Render Cloud)
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcrypt
- **CORS**: cors middleware
- **Environment**: dotenv

### DevOps
- **Version Control**: Git
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript Compiler
- **Development**: Hot Module Replacement (HMR)

## Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/yourusername/hydratemate.git
cd hydratemate

# 2. Frontend installieren und starten
npm install
npm run dev

# 3. Backend installieren und starten (neues Terminal)
cd backend
npm install
npm start

# 4. App öffnen
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

## Installation

### Voraussetzungen
- Node.js >= 20.x
- npm >= 10.x
- Git

### Frontend Setup

```bash
# Dependencies installieren
npm install

# Environment Variables (optional)
cp .env.example .env

# Development Server starten
npm run dev

# Öffne Browser: http://localhost:5173
```

### Backend Setup

```bash
cd ../Backend

# Dependencies installieren
npm install

# Environment Variables konfigurieren
cp .env.example .env
# Bearbeite .env:
# - DATABASE_URL: PostgreSQL Connection String
# - JWT_SECRET: Zufälliger Secret Key
# - CORS_ORIGIN: http://localhost:5173

# Server starten
npm start

# Server läuft auf: http://localhost:3000
```

### Database Setup

Die App nutzt eine Render PostgreSQL Cloud-Datenbank:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Development

### Available Scripts

#### Frontend

```bash
# Development Server (Hot Reload)
npm run dev

# Type Checking
npm run type-check

# Build für Production
npm run build

# Preview Production Build
npm run preview

# Linting
npm run lint
```

#### Backend

```bash
cd ../Backend

# Development mit Nodemon (Hot Reload)
npm run dev

# Production Server
npm start

# TypeScript Build
npm run build
```

### Development Workflow

**Terminal 1 (Backend):**
```bash
cd Backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

**Browser:**
```
http://localhost:5173
```

## Projekt-Struktur

```
Frontend/
├── src/
│   ├── assets/              # CSS, Bilder
│   │   ├── base.css         # Base Styles
│   │   └── style.css        # Global Styles
│   ├── components/          # Vue Komponenten
│   │   └── GuestBanner.vue  # Gast-Modus Info Banner
│   ├── composables/         # Vue Composables
│   │   └── useAuth.ts       # Authentication Logic
│   ├── constants/           # App-Konstanten
│   │   └── index.ts         # Zentrale Konstanten
│   ├── pages/               # Page Components
│   │   ├── Dashboard.vue    # Haupt-Dashboard
│   │   ├── Settings.vue     # Einstellungen
│   │   └── ProfileSetup.vue # Profil-Setup
│   ├── router/              # Vue Router
│   │   └── index.ts         # Route Definitions
│   ├── types/               # TypeScript Types
│   │   ├── index.ts         # Zentrale Types
│   │   └── guest.ts         # Gast-spezifische Types
│   ├── utils/               # Utility Functions
│   │   ├── calculations.ts  # Berechnungen
│   │   ├── formatting.ts    # Formatierung
│   │   ├── storage.ts       # LocalStorage Wrapper
│   │   └── logger.ts        # Logging Utility
│   ├── views/               # View Components
│   │   ├── LoginView.vue    # Login-Seite
│   │   ├── HistoryView.vue  # Verlauf-Seite
│   │   └── StatisticsView.vue # Statistik-Seite
│   ├── App.vue              # Root Component
│   └── main.ts              # App Entry Point
├── public/                  # Static Assets
├── .env.example             # Example Environment
├── package.json             # Dependencies
├── vite.config.ts           # Vite Configuration
├── tailwind.config.js       # Tailwind Configuration
├── tsconfig.json            # TypeScript Config
└── README.md                # Diese Datei

Backend/
├── src/
│   ├── routes/              # API Routes
│   ├── controllers/         # Business Logic
│   ├── middleware/          # Express Middleware
│   ├── db/                  # Database Config
│   └── server.ts            # Server Entry Point
├── .env                     # Environment Variables
└── package.json             # Dependencies
```

## API Endpoints

### Authentication

```http
POST   /api/auth/register    # Registrierung
POST   /api/auth/login       # Login
GET    /api/auth/me          # Current User
```

**Example:**
```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
```

### Profile

```http
GET    /api/profile/:userId        # Profil laden
PUT    /api/profile/:userId        # Profil aktualisieren
```

### Hydration

```http
GET    /api/hydration/today/:userId      # Heutige Daten
POST   /api/intakes                      # Intake hinzufügen
GET    /api/intakes/:userId/history      # Verlauf
DELETE /api/intakes/:intakeId            # Eintrag löschen
```

### Statistics

```http
GET    /api/statistics/:userId/last-7-days    # 7-Tage Stats
```

### Guest Migration

```http
POST   /api/migrate-guest-data              # Gast-Daten migrieren
```

## Deployment

### Frontend (Vercel/Netlify)

```bash
# Build
npm run build

# Deploy-Ordner
dist/

# Environment Variables
VITE_API_URL=https://your-backend.com
```

**Vercel Deployment:**
```bash
vercel --prod
```

### Backend (Render)

1. **GitHub verbinden**
2. **Web Service erstellen**
3. **Configuration:**
   - Root Directory: `Backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Environment Variables setzen:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `NODE_ENV=production`

### Database (Render PostgreSQL)

```bash
# Database ist bereits erstellt
# Connection String in .env einfügen
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Testing

### Unit & Component Tests

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Mode (Auto-Reload)
npm run test:watch

# Vitest UI im Browser
npm run test:ui

# Coverage Report generieren
npm run test:coverage
```

### CI/CD

Tests werden automatisch ausgeführt bei:
- ✅ Push auf `main` Branch
- ✅ Pull Requests auf `main`

Status: ![Frontend Tests](https://github.com/Dorian509/FrontEnd/workflows/Frontend%20CI/badge.svg)

### Type Check & Build

```bash
# Type Check
npm run type-check

# Build Test
npm run build

# ESLint
npm run lint
```

## Customization

### Farben anpassen (`src/assets/base.css`)

```css
:root {
  --game-cyan: #06b6d4;
  --game-blue: #3b82f6;
  --game-purple: #a855f7;
  --game-pink: #ec4899;
}
```

### Konstanten anpassen (`src/constants/index.ts`)

```typescript
export const DEFAULTS = {
  WEIGHT_KG: 70,
  ACTIVITY_LEVEL: 'MEDIUM',
  CLIMATE: 'NORMAL',
  GOAL_ML: 2500
}
```

## Contributing

Contributions sind willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

### Development Setup

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Mache deine Änderungen
4. Schreibe/Update Tests
5. Committe mit Conventional Commits
6. Push und erstelle einen Pull Request

### Code Style

- TypeScript Strict Mode
- ESLint Rules befolgen
- Prettier Formatting
- JSDoc Kommentare für alle Funktionen
- Component Dokumentation

## Credits

- **Icons**: [Font Awesome](https://fontawesome.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Charts**: [Chart.js](https://www.chartjs.org)
- **Framework**: [Vue.js](https://vuejs.org)

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/hydratemate/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/hydratemate/wiki)

## Roadmap

### Version 1.1
- [ ] PWA Support (Offline-Modus)
- [ ] Push Notifications (Trink-Erinnerungen)
- [ ] Dark/Light Theme Toggle
- [ ] Export als CSV/PDF

### Version 1.2
- [ ] Social Features (Challenges)
- [ ] Erfolge & Badges System
- [ ] Wochenberichte via Email
- [ ] Mobile App (React Native)



