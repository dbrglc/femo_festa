# femo_festa

Progetto Astro + Cognito + Lambda + WebSocket + AWS CDK per una classifica pubblica con area ordini protetta.

## Struttura del progetto

- `frontend/` - applicazione Astro pubblica e area ordini protetta.
- `backend/` - funzioni Lambda per API REST e gestione ordini.
- `infra/` - infrastruttura AWS CDK per Cognito, API Gateway HTTP, WebSocket, DynamoDB e hosting.
- `shared/` - tipi TypeScript condivisi tra frontend e backend.

## Comandi principali

### Frontend

```bash
cd frontend
npm install
npm run build
```

### Backend

```bash
cd backend
npm install
npm run build
```

### Infrastruttura CDK

```bash
cd infra
npm install
npx cdk synth
```

Per il deploy in ambiente `dev`:

```bash
npx cdk deploy -c stage=dev
```

Per il deploy in ambiente `prod`:

```bash
npx cdk deploy -c stage=prod
```

## GitHub Actions

- `.github/workflows/deploy-frontend.yml` - build frontend su modifiche in `frontend/**`.
- `.github/workflows/deploy-backend.yml` - build backend e synth CDK su modifiche in `backend/**`, `infra/**`, `shared/**`.

## Verifiche

- La classifica pubblica deve essere visibile senza login.
- L’endpoint `POST /orders` deve richiedere l’header `Authorization`.
- La pagina `frontend/src/pages/order.astro` guida il login Cognito e l’invio ordini.
- Il backend condivide i modelli tramite `shared/types.ts`.
