import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { WebSocketConnection } from "@repo/shared";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Inizializza client AWS
const region = process.env.AWS_REGION || 'eu-south-1';
const dynamoClient = new DynamoDBClient({ region });

/**
 * Handler per la connessione WebSocket.
 * Memorizza la nuova connessione su DynamoDB con timestamp e metadata.
 */
export const connectHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Valida le variabili di ambiente richieste
    const tableName = process.env.WEBSOCKET_CONNECTIONS_TABLE;
    if (!tableName) {
      console.error('Variabile di ambiente WEBSOCKET_CONNECTIONS_TABLE non configurata');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Configurazione server mancante' }) 
      };
    }

    // Estrae l'ID della connessione dall'evento
    const connectionId = event.requestContext.connectionId;
    if (!connectionId) {
      console.error('ConnectionId non trovato nell\'evento');
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'ConnectionId mancante' }) 
      };
    }

    // Crea l'oggetto connessione con metadata
    const now = new Date().toISOString();
    const connection: WebSocketConnection = {
      connectionId,
      connectedAt: now,
      updatedAt: now,
    };

    // Memorizza la connessione su DynamoDB
    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(connection),
    });

    await dynamoClient.send(command);
    console.log(`Connessione WebSocket stabilita: ${connectionId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Connesso con successo', connectionId }),
    };
  } catch (error) {
    console.error('Errore in connectHandler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Errore durante la connessione' }),
    };
  }
};