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

#### 2️⃣ Componente Leaderboard con WebSocket Real-Time

**File**: `frontend/src/components/Leaderboard.ts`

**Funzionalità**:
- ✅ Tabella HTML dinamica (Squadra, Punteggio)
- ✅ Fetch iniziale leaderboard da API REST `/leaderboard`
- ✅ Connessione WebSocket a endpoint dinamico
- ✅ Real-time update quando tipo messaggio = `LEADERBOARD_UPDATE`
- ✅ Auto-reconnect ogni 2 secondi se disconnesso
- ✅ Error handling su fetch e WebSocket
- ✅ Cleanup function ritornata per eventuali close manuali

**Workflow**:
```
Page Load → Fetch GET /leaderboard → Tabella renderizzata iniziale →
WebSocket connetti → Attendi messaggi → Se type=LEADERBOARD_UPDATE →
Estrai payload.leaderboard → Update tbody con renderRows() → 
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

2. **`frontend/src/components/Leaderboard.ts`**
   - Fetch iniziale della leaderboard
   - Connessione WebSocket
   - Real-time update su messaggi LEADERBOARD_UPDATE
   - Error handling su fetch e WebSocket
   - Auto-reconnect configurato
   - Cleanup function

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
│  │ - Cognito Login      │        │ - GET /leaderboard   │  │
│  │ - Form Insert Score  │        │ - WebSocket Connect  │  │
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
