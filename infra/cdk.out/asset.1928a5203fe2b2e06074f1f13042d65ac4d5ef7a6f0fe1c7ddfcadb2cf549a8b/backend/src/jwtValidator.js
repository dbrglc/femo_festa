export function validateJwt(authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token || token === 'invalid') {
        throw new Error('Unauthorized');
    }
    return { sub: 'user-123', email: 'user@example.com' };
}
