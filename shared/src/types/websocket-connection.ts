/**
 * Schema per una connessione WebSocket memorizzata su DynamoDB
 */
export interface WebSocketConnection {
  /** ID univoco della connessione WebSocket */
  connectionId: string;
  /** Timestamp di creazione della connessione (ISO 8601) */
  connectedAt: string;
  /** Timestamp di ultimo aggiornamento */
  updatedAt: string;
}
