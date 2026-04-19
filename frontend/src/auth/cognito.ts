const COGNITO_DOMAIN = 'https://your-auth-domain.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = 'YOUR_COGNITO_APP_CLIENT_ID';
const REDIRECT_URI = `${window.location.origin}/order`;
const RESPONSE_TYPE = 'token';
const SCOPE = 'openid email';

export function getLoginUrl(): string {
  return `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(
    SCOPE,
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

export function logout(): void {
  localStorage.removeItem('cognito_access_token');
  window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
    window.location.origin,
  )}`;
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
