import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Inizializza client AWS
const region = process.env.AWS_REGION || 'eu-south-1';
const dynamoClient = new DynamoDBClient({ region });

/**
 * Handler per la disconnessione WebSocket.
 * Rimuove la connessione dalla tabella DynamoDB.
 */
export const disconnectHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Rimuove la connessione da DynamoDB
    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: marshall({ connectionId }),
    });

    await dynamoClient.send(command);
    console.log(`Connessione WebSocket rimossa: ${connectionId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Disconnesso con successo' }),
    };
  } catch (error) {
    console.error('Errore in disconnectHandler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Errore durante la disconnessione' }),
    };
  }
};