const COGNITO_DOMAIN = import.meta.env.PUBLIC_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.PUBLIC_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.PUBLIC_COGNITO_REDIRECT_URI;
const RESPONSE_TYPE = 'token';

export function getLoginUrl(): string {
  console.log('Generating login URL with the following parameters:');
  console.log(`COGNITO_DOMAIN: ${COGNITO_DOMAIN}`);
  console.log(`CLIENT_ID: ${CLIENT_ID}`);
  console.log(`REDIRECT_URI: ${REDIRECT_URI}`);
  return `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

export function logout(): void {
  localStorage.removeItem('cognito_access_token');
  window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&logout_uri=${encodeURIComponent(
    window.location.origin)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

export function storeAccessToken(token: string): void {
  localStorage.setItem('cognito_access_token', token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem('cognito_access_token');
}

export function parseHashToken(): string | null {
  if (window.location.hash.startsWith('#')) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('access_token');
    if (token) {
      storeAccessToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
      return token;
    }
  }
  return null;
}
