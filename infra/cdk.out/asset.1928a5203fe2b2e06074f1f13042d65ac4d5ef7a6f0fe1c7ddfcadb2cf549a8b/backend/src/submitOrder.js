import { validateJwt } from './jwtValidator.js';
export const handler = async (event) => {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
            return { statusCode: 401, body: 'Authorization header missing' };
        }
        validateJwt(authHeader);
        const body = event.body ? JSON.parse(event.body) : null;
        const order = body;
        if (!order?.teamName || typeof order.score !== 'number') {
            return { statusCode: 400, body: 'Payload non valido' };
        }
        // Qui si potrebbe salvare l'ordine su DynamoDB e inviare un broadcast WebSocket.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Ordine accettato', order }),
        };
    }
    catch (error) {
        return { statusCode: 401, body: 'Token non valido' };
    }
};
