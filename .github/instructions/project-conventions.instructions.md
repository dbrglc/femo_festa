---
description: "Use when working with femo_festa codebase. Covers TypeScript conventions, Lambda handler patterns, AWS CDK structure, shared types, and error handling across backend, frontend, and infrastructure."
---

# femo_festa Project Conventions

## TypeScript & Modules

- **Target**: ES2020 modules with `type: "module"` in package.json
- **Strict mode**: All TypeScript files use `strict: true` in tsconfig.json
- **Path aliases**: Use `@shared/*` to import from shared types folder
- **Imports**: Always use explicit `import type` for TypeScript interfaces and types

```typescript
// ✅ Correct
import type { Team, Order } from '@shared/types';
import { validateJwt } from './jwtValidator.ts';

// ❌ Avoid
import { Team } from '@shared/types'; // Use 'import type' for interfaces
```

## Backend: Lambda Handlers

- **Handler signature**: Use AWS Lambda types from `aws-lambda` package
- **Error handling**: Wrap logic in try/catch, return appropriate HTTP status codes
- **Validation**: Always validate request headers and body payload before processing
- **Return format**: Consistent response with `statusCode`, `headers`, and `body` (JSON-stringified)

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // Validation
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: 'Authorization header missing' };
    }
    // Logic
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: '...' }),
    };
  } catch (error) {
    return { statusCode: 500, body: 'Internal server error' };
  }
};
```

## Shared Types

- **Location**: `shared/types.ts`
- **Pattern**: Export interfaces for Team, Order, WebSocketUpdate, and other cross-layer entities
- **Naming**: Use PascalCase for interface names
- **Import alias**: Frontend and backend import via `@shared/types`

```typescript
export interface Team {
  name: string;
  score: number;
}

export interface Order {
  teamName: string;
  score: number;
}
```

## Infrastructure: AWS CDK

- **Stack pattern**: Extend `cdk.Stack`, accept typed props extending `StackProps`
- **Resource naming**: Use PascalCase for resource logical IDs (e.g., `LeaderboardFunction`)
- **Environment context**: Read stage from `props.stage` and pass to Lambda environment
- **Separation**: Each major service (API, Auth, WebSocket, DynamoDB) in its own stack file

```typescript
interface ApiStackProps extends StackProps {
  stage: string;
  userPool: cognito.UserPool;
}

export class ApiStack extends Stack {
  constructor(scope: cdk.App, id: string, props: ApiStackProps) {
    super(scope, id, props);
    // Resource definitions
  }
}
```

## Frontend: Astro + Cognito

- **Components**: Use `.ts` or `.astro` files; keep components focused and typed
- **Authentication**: Use Cognito via `auth/cognito.ts` for login/token management
- **Type safety**: Import Team and Order types from `@shared/types`

## Code Comments

- Comments may be in Italian or English
- Keep comments concise and adjacent to the code they describe
- Use `// TODO:` for incomplete sections with context (e.g., DynamoDB persistence)

## Build & Deployment

- **Build command**: `tsc -p tsconfig.json` for TypeScript compilation to `dist/`
- **Stages**: Support both `dev` and `prod` environments via CDK context (`-c stage=dev|prod`)
- **Package manager**: Use ``npm`` for dependency management and scripts
