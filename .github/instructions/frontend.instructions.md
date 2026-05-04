---
applyTo: '**'
description: Describe the frontend implementation details, file changes, integration points, and documentation created for the femo_festa project.
---

# 🎉 Frontend femo_festa

Presenti due pagine frontend funzionanti e integrate con backend e infrastruttura AWS:

#### 1️⃣ Pagina `/order` - Area Inserimento Ordini

**File**: `frontend/src/pages/order.astro`

**Funzionalità**:
- ✅ Login/Logout con Cognito OAuth 2.0 Implicit Grant
- ✅ Form inserimento ordini (teamName, score)
- ✅ Validazione client-side
- ✅ POST request a `/orders` con JWT Authorization header
- ✅ Messaggi di feedback (loading, success ✅, error ❌)
- ✅ Auto-clear messaggi dopo 5 secondi
- ✅ CSS styling responsive
- ✅ Error handling completo

**Workflow**:
```
User → Login Button → Cognito OAuth → Token estratto da #access_token
→ parseHashToken() salva in localStorage → Form visibile → 
Submit → POST /orders con Bearer token → Response (success/error) → 
Messaggio mostrato → Leaderboard aggiorna live via WebSocket
```

#### 2️⃣ Componente LeaderboardAnimated con WebSocket Real-Time

**File**: `frontend/src/components/LeaderboardAnimated.ts`

**Funzionalità**:
- ✅ Podio animato (top 3 barre verticali con corona)
- ✅ Lista ranking dal 4° in poi
- ✅ Connessione WebSocket a endpoint dinamico
- ✅ Fetch iniziale leaderboard dal primo messaggio WebSocket
- ✅ Real-time update quando tipo messaggio = `LEADERBOARD_UPDATE`
- ✅ Animazioni al cambio di posizione (300-500ms)
- ✅ Auto-reconnect ogni 2 secondi se disconnesso
- ✅ Cleanup function ritornata per eventuali close manuali

**Workflow**:
```
Page Load → WebSocket connetti → Primo messaggio = LEADERBOARD_UPDATE
→ Estrai payload.leaderboard → Podio + Lista renderizzati iniziali →
Attendi messaggi → Se type=LEADERBOARD_UPDATE → calculatePositionChange() →
Assegna animazioni → CSS @keyframes eseguono animazione →
Leaderboard visibile sempre aggiornata
```

#### 3️⃣ Homepage Leaderboard Pubblica

**File**: `frontend/src/pages/index.astro`

**Status**: ✅ Verificato e OK (già corretto nel progetto originale)

---

### 📦 File Creati/Aggiornati

#### Creati ✨
1. **`frontend/.env.example`** - Template configurazione variabili ambiente
   - PUBLIC_API_URL
   - PUBLIC_WS_URL
   - PUBLIC_COGNITO_DOMAIN
   - PUBLIC_COGNITO_REDIRECT_URI
   - PUBLIC_AWS_REGION

#### Aggiornati 🔄
1. **`frontend/src/pages/order.astro`**
   - Completato login/logout handler
   - Implementato submit ordine con error handling
   - Aggiunto styling completo
   - Messaggi di feedback con emoji
   - Validazione form e token

2. **`frontend/src/components/LeaderboardAnimated.ts`**
   - Connessione WebSocket per leaderboard
   - Fetch iniziale dal primo messaggio WebSocket
   - Real-time update su messaggi LEADERBOARD_UPDATE
   - Rendering podio e lista con animazioni

---

### 🔗 Integrazione Architetturale

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Astro)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐        ┌──────────────────────┐  │
│  │  /order (Insert)     │        │  / (Leaderboard)     │  │
│  ├──────────────────────┤        ├──────────────────────┤  │
│  │ - Cognito Login      │        │ - WebSocket Connect  │  │
│  │ - Form Insert Score  │        │ - Initial Fetch      │  │
│  │ - POST /orders       │        │ - Real-time Update   │  │
│  │ - JWT Bearer Token   │        │                      │  │
│  └──────────────────────┘        └──────────────────────┘  │
│           │                               ▲                │
│           │                               │                │
├───────────┼───────────────────────────────┼────────────────┤
│           │ REST API                      │ WebSocket      │
│           ▼                               │                │
│    ┌──────────────────┐          ┌────────────────────┐    │
│    │ Backend (Lambda) │          │ WebSocket API      │    │
│    ├──────────────────┤          │ (API Gateway v2)   │    │
│    │ - submitOrder    │          ├────────────────────┤    │
│    │ - Validate Token │          │ - $connect         │    │
│    │ - Update Score   │          │ - $disconnect      │    │
│    │ - Broadcast MSG  │          │ - broadcastHandler │    │
│    └────────┬─────────┘          └────────┬───────────┘    │
│             │                             │                │
└─────────────┼─────────────────────────────┼────────────────┘
              │                             │
         ┌────┴──────────────────────────┬──┴────┐
         │      DynamoDB (AWS)           │        │
         ├───────────────────────────────┼────────┤
         │ - leaderboard table           │        │
         │   (scores)                    │        │
         │ - websocket_connections table │        │
         │   (active connections)        │        │
         └───────────────────────────────┴────────┘
```

---

### 🔑 Chiavi Tecniche Implementate

#### 1. OAuth 2.0 Implicit Grant Flow
```
Frontend → Cognito Login → User Auth → Redirect a /order?#access_token=xxx
→ parseHashToken() estrae JWT → Salvato in localStorage → 
Disponibile per API calls via getAccessToken()
```

#### 2. Real-Time Update via WebSocket
```
Backend aggiorna DynamoDB → Invoca Broadcast Lambda →
Broadcast scansiona connessioni WebSocket → 
PostToConnectionCommand manda LEADERBOARD_UPDATE →
Frontend riceve messaggio → renderRows() aggiorna tabella
```

#### 3. Gestione Stato di Autenticazione
```
Button cambia da "Login" a "Logout" in base a getAccessToken()
Form visibile solo se loggato
Authorization header aggiunto automaticamente
```

---

### 📚 Documentazione Creata

| File | Descrizione |
|------|-------------|
| `FRONTEND_SETUP.md` | Guida completa setup, configurazione, API, troubleshooting |
| `FRONTEND_INTEGRATION_CHECKLIST.md` | Checklist step-by-step + test scenarios |
| `frontend/.env.example` | Template variabili ambiente |
| Session Notes | `/memories/session/frontend-context.md` |

---

### ✨ Highlights Implementazione

✅ **Separazione delle responsabilità**: Componenti isolati (Leaderboard.ts, cognito.ts, useWebSocket.ts)

✅ **Error Handling Robusto**: Try-catch su fetch, WebSocket, JSON parsing

✅ **User Feedback**: Messaggi loading, success (✅), error (❌) con auto-clear

✅ **Real-Time**: WebSocket con auto-reconnect e fallback

✅ **Type Safety**: TypeScript + shared types da @repo/shared

✅ **Environment Configuration**: Variabili ambiente per tutti gli endpoint dinamici

✅ **Security**: JWT Bearer tokens, Cognito authentication flow, localStorage token storage

✅ **Accessibility**: Form con labels, semantic HTML, responsive design

✅ **Performance**: Fetch iniziale + WebSocket live updates (no polling)
