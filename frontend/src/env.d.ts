/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_WS_URL: string;
  readonly PUBLIC_COGNITO_CLIENT_ID: string;
  readonly PUBLIC_COGNITO_DOMAIN: string;
  readonly PUBLIC_COGNITO_REDIRECT_URI: string;
  readonly PUBLIC_AWS_REGION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}