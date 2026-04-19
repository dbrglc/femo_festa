---
name: plan project
description: Describe the project structure and implementation plan for an Astro + Cognito + Lambda application.
agent: agent
---

## Plan: Astro + Cognito + Lambda project structure

Struttura il progetto con una classifica pubblica in Astro e un’area ordine protetta da Cognito. Usa AWS Lambda per le API e la WebSocket API solo per aggiornamenti realtime, ma non richiedere login per consultare la classifica.

**Steps**
1. Creare il frontend Astro sotto `frontend/`.
   - `src/pages/index.astro` come pagina pubblica della classifica.
   - `src/auth/cognito.ts` per login/logout e gestione token.
   - `src/pages/order.astro` come pagina protetta da login per l’inserimento ordini.
   - `src/components/Leaderboard.ts` per renderizzare la classifica e aggiornare in realtime.
   - `src/hooks/useWebSocket.ts` per connessione realtime client-side.
2. Configurare Cognito User Pool in CDK.
   - Creare User Pool, App Client e dominio Cognito.
   - Configurare callback URL verso il frontend Astro.
   - Usare Hosted UI o SDK Cognito per login, ma solo per l’area ordini.
3. Creare il backend in `backend/`.
   - Lambda HTTP per `GET /leaderboard` pubblico.
   - Lambda HTTP per `POST /orders` autenticato.
   - Lambda WebSocket per `$connect`, `$disconnect` e broadcast aggiornamenti.
   - DynamoDB per stato squadra/leaderboard e connessioni WebSocket.
   - Implementare validazione JWT Cognito solo su endpoint protetti.
4. Definire l’infrastruttura con AWS CDK in `infra/`, deve stare tutto nello stesso stack cloudformation.
   - Stack Cognito, stack API Gateway HTTP, stack WebSocket, stack DynamoDB, stack hosting frontend.
   - Supportare ambienti `dev` e `prod` con CDK context o stack separati.
   - Hosting frontend su S3 + CloudFront per pubblicazione.
5. Aggiungere GitHub Actions.
   - Workflow separati per FE e BE, con trigger `paths` su `frontend/**` e `backend/**`.
   - Workflow `deploy-frontend.yml` e `deploy-backend.yml` per build e deploy isolati.
   - Gestire segreti AWS, environment vars e target `dev`/`prod`.
6. Verificare e testare.
   - Verificare che la classifica sia visibile senza login.
   - Verificare accesso protetto all’area ordini e invio con token.
   - Verificare aggiornamenti realtime della classifica pubblica.

**Relevant files**
- `frontend/package.json` — dipendenze Astro e script build.
- `frontend/astro.config.mjs` — configurazione Astro.
- `frontend/src/pages/index.astro` — classifica pubblica.
- `frontend/src/pages/order.astro` — form ordini autenticato.
- `frontend/src/auth/cognito.ts` — helper Cognito.
- `frontend/src/components/Leaderboard.ts` — classifica realtime.
- `frontend/src/hooks/useWebSocket.ts` — gestione connessione websocket.
- `backend/src/getLeaderboard.ts` — Lambda `GET /leaderboard` pubblico.
- `backend/src/submitOrder.ts` — Lambda `POST /orders` autenticato.
- `backend/src/websocketHandlers.ts` — WebSocket gestione e broadcast.
- `backend/src/jwtValidator.ts` — verifica token Cognito.
- `infra/bin/femo_festa.ts` — entry point CDK.
- `infra/lib/stacks/AuthStack.ts` — Cognito User Pool.
- `infra/lib/stacks/ApiStack.ts` — API Gateway + Lambda.
- `infra/lib/stacks/WebSocketStack.ts` — WebSocket API.
- `infra/lib/stacks/FrontendStack.ts` — hosting S3/CloudFront.
- `.github/workflows/deploy.yml` — pipeline CI/CD.

**Verification**
1. `frontend/` builda con Astro.
2. `cdk synth` genera risorse Cognito, API, WebSocket e hosting.
3. La pagina pubblica mostra la classifica senza login.
4. Solo `POST /orders` richiede Authorization header valido.
5. I client pubblici ricevono aggiornamenti realtime dopo un ordine.
6. Workflow GitHub Actions esegue build e deploy in dev.

**Decisions**
- La classifica è pubblica e accessibile a chiunque.
- L’area di inserimento ordini è protetta da Cognito.
- Il backend rimane minimale con lambda per API e WebSocket.
- Astro è usato come shell mobile-first e UI leggera.
- CDK gestisce dev/prod, resourcing e hosting.

**Further Considerations**
1. Se vuoi minimizzare la complessità frontend, usa il Cognito Hosted UI solo per login e conserva la classifica in una pagina separata.
2. La WebSocket API invierà sempre l'intero stato per ridurre traffico.
3. Abilitare logging CloudWatch per Lambda, API Gateway e DynamoDB per monitoraggio, debug e alerting su errori.
