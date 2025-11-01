# Contributing zu HydrateMate 💧

Vielen Dank für dein Interesse, zu HydrateMate beizutragen! 🎉

## 📋 Inhaltsverzeichnis

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

### Unsere Standards

- Respektvoll und professionell kommunizieren
- Konstruktives Feedback geben
- Verschiedene Meinungen akzeptieren
- Fokus auf das Beste für die Community

## Getting Started

### Voraussetzungen

- Node.js >= 20.x
- npm >= 10.x
- Git
- TypeScript Kenntnisse
- Vue.js 3 Kenntnisse

### Repository Setup

```bash
# 1. Fork das Repository auf GitHub

# 2. Clone dein Fork
git clone https://github.com/DEIN-USERNAME/hydratemate.git
cd hydratemate

# 3. Füge Upstream Remote hinzu
git remote add upstream https://github.com/ORIGINAL-OWNER/hydratemate.git

# 4. Dependencies installieren
npm install
cd Backend && npm install && cd ..

# 5. Erstelle einen Feature Branch
git checkout -b feature/amazing-feature
```

## Development Setup

### Frontend

```bash
# Development Server starten
npm run dev

# Type Checking
npm run type-check

# Linting
npm run lint
```

### Backend

```bash
cd Backend

# Development Server
npm run dev

# In separatem Terminal
```

### Beide gleichzeitig

```bash
# Terminal 1: Backend
cd Backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

## Code Style Guide

### TypeScript

#### Strict Mode aktiviert
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

#### Type Safety
```typescript
// ✅ GOOD
function calculateGoal(profile: Profile): number {
  return profile.weightKg * 35
}

// ❌ BAD
function calculateGoal(profile: any) {
  return profile.weightKg * 35
}
```

#### Interfaces vs Types
```typescript
// ✅ Nutze Interfaces für Objekte
interface User {
  id: number
  name: string
}

// ✅ Nutze Types für Unions/Literals
type ActivityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
```

### Vue.js

#### Composition API mit `<script setup>`
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from '@/types'

// Props
const props = defineProps<{
  user: User
}>()

// Emits
const emit = defineEmits<{
  save: [user: User]
}>()

// State
const loading = ref(false)

// Computed
const displayName = computed(() => props.user.name)
</script>
```

#### Component Dokumentation
```vue
<script setup lang="ts">
/**
 * UserProfile Component
 *
 * Zeigt Benutzer-Profil mit Avatar und Infos
 *
 * @component
 */
</script>
```

### Styling

#### Tailwind CSS bevorzugen
```vue
<!-- ✅ GOOD -->
<div class="bg-gray-800 rounded-lg p-4">

<!-- ❌ BAD (avoid inline styles) -->
<div style="background: #1f2937; border-radius: 8px; padding: 16px">
```

#### CSS nur wenn nötig
```vue
<style scoped>
/* Nur für komplexe Animationen oder spezielle Cases */
.custom-animation {
  animation: slide 300ms ease-out;
}

@keyframes slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
</style>
```

### Naming Conventions

#### Files
```
components/UserProfile.vue      # PascalCase
composables/useAuth.ts          # camelCase mit "use" prefix
utils/calculations.ts           # camelCase
types/index.ts                  # lowercase
constants/index.ts              # lowercase
```

#### Variables & Functions
```typescript
// Constants
const MAX_RETRIES = 3
const API_BASE_URL = '/api'

// Variables
const userName = 'Max'
const isLoading = ref(false)

// Functions
function calculateDailyGoal() {}
function handleUserClick() {}

// Components
const UserProfile = defineComponent({})
```

### JSDoc Comments

#### Für alle öffentlichen Funktionen
```typescript
/**
 * Berechnet das tägliche Hydrationsziel
 *
 * Formel: Gewicht × 35ml + Aktivitätsbonus + Klimabonus
 *
 * @param profile - Benutzer-Profil
 * @returns Tagesziel in Millilitern
 *
 * @example
 * ```ts
 * const goal = calculateDailyGoal({
 *   weightKg: 70,
 *   activityLevel: 'MEDIUM',
 *   climate: 'NORMAL'
 * })
 * // Returns: 2700
 * ```
 */
export function calculateDailyGoal(profile: Profile): number {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ GOOD
try {
  const data = await fetchData()
  return data
} catch (error) {
  logger.error('Failed to fetch data:', error)
  throw new Error('Data fetch failed')
}

// ❌ BAD
try {
  const data = await fetchData()
  return data
} catch (e) {
  console.log(e) // Nicht aussagekräftig
}
```

### Logging

```typescript
import { logger } from '@/utils/logger'

// ✅ GOOD - Nutze Logger
logger.debug('User loaded:', user)    // Nur in Dev
logger.info('Profile saved')           // Nur in Dev
logger.warn('Invalid data:', data)     // Immer
logger.error('API failed:', error)     // Immer

// ❌ BAD - Keine console.log
console.log('test')  // Entfernen vor Commit!
```

## Commit Guidelines

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Neue Features
- `fix`: Bug Fixes
- `docs`: Dokumentation
- `style`: Formatting, fehlende Semikolons, etc.
- `refactor`: Code Refactoring
- `perf`: Performance Verbesserungen
- `test`: Tests hinzufügen/ändern
- `chore`: Maintenance (deps, config, etc.)
- `ci`: CI/CD Änderungen

### Examples

```bash
# Feature
feat(dashboard): add water intake history section

# Bug Fix
fix(settings): correct goal calculation for guest mode

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(utils): extract calculation logic to separate file

# Style
style(components): format code with prettier

# Chore
chore(deps): update vue to 3.5.0
```

### Guter Commit Message
```
feat(statistics): add 7-day consumption chart

- Implement Chart.js integration
- Add responsive chart configuration
- Display average consumption line
- Show percentage indicators

Closes #42
```

## Pull Request Process

### 1. Sync mit Upstream

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Code Quality Checks

```bash
# Type Check
npm run type-check

# Linting
npm run lint

# Build Test
npm run build
```

### 3. Commit & Push

```bash
git add .
git commit -m "feat(dashboard): add feature X"
git push origin feature/amazing-feature
```

### 4. Pull Request erstellen

1. Gehe zu GitHub
2. Klicke "New Pull Request"
3. Wähle dein Branch
4. Fülle die PR Template aus:

```markdown
## Description
Kurze Beschreibung der Änderungen

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Type checks passing
- [ ] Build successful

## Screenshots (wenn UI Änderung)
[Screenshots hier einfügen]

## Related Issues
Closes #123
```

### 5. Code Review

- Adressiere Reviewer-Feedback
- Pushe weitere Commits wenn nötig
- Merge nach Approval

## Testing

### Manual Testing

```bash
# 1. Starte Dev Server
npm run dev

# 2. Teste Features manuell
# - Registrierung/Login
# - Dashboard Funktionen
# - Settings Speichern
# - Statistiken laden
```

### Type Checking

```bash
npm run type-check
```

### Build Testing

```bash
# Test Production Build
npm run build

# Sollte ohne Errors durchlaufen
```

## Documentation

### Component Documentation

Jede Component sollte dokumentiert sein:

```vue
<script setup lang="ts">
/**
 * DashboardView
 *
 * Haupt-Dashboard der Anwendung mit:
 * - Tagesfortschritt
 * - Quick-Add Buttons
 * - History
 * - Streak-Tracking
 *
 * @component
 */
</script>
```

### README Updates

Bei neuen Features bitte README.md aktualisieren:
- Feature Liste
- Installation Steps (wenn geändert)
- Usage Examples
- API Endpoints (wenn neu)

## Project Structure

Bei neuen Dateien beachte die Struktur:

```
src/
├── components/      # Wiederverwendbare UI Komponenten
├── composables/     # Vue Composables (useX)
├── constants/       # Konstanten
├── pages/           # Page Components
├── router/          # Router Config
├── types/           # TypeScript Types
├── utils/           # Utility Functions
└── views/           # View Components
```

## Best Practices

### 1. Single Responsibility

```typescript
// ✅ GOOD - Eine Funktion, eine Aufgabe
function calculateDailyGoal(profile: Profile): number {}
function validateProfile(profile: Profile): boolean {}

// ❌ BAD - Zu viel in einer Funktion
function processProfile(profile: Profile) {
  // validate
  // calculate
  // save
  // notify
}
```

### 2. DRY (Don't Repeat Yourself)

```typescript
// ✅ GOOD - Wiederverwendbare Utility
import { calculateDailyGoal } from '@/utils/calculations'

const goal1 = calculateDailyGoal(profile1)
const goal2 = calculateDailyGoal(profile2)

// ❌ BAD - Duplizierter Code
const goal1 = profile1.weightKg * 35 + activityBonus + climateBonus
const goal2 = profile2.weightKg * 35 + activityBonus + climateBonus
```

### 3. Type Safety

```typescript
// ✅ GOOD
import type { User, Profile } from '@/types'

function updateProfile(user: User, profile: Profile): void {}

// ❌ BAD
function updateProfile(user, profile) {} // Keine Types
```

### 4. Const over Let

```typescript
// ✅ GOOD
const userName = 'Max'
const items = [1, 2, 3]

// ❌ BAD (wenn nicht nötig)
let userName = 'Max'  // Wird nicht reassigned
```

## Fragen?

- **GitHub Issues**: [Issues öffnen](https://github.com/yourusername/hydratemate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hydratemate/discussions)
- **Email**: dorian.gutsche@example.com

---

**Danke für deinen Beitrag! 💧🎮**
