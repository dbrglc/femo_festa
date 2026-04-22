import { DynamoDBClient, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { WebSocketConnection, WebSocketUpdate } from '@repo/shared';

// Inizializza client AWS
const region = process.env.AWS_REGION || 'eu-south-1';
const dynamoClient = new DynamoDBClient({ region });
const apiGatewayClient = new ApiGatewayManagementApiClient({
    region,
    endpoint: process.env.API_GATEWAY_ENDPOINT_URL,
    });

/**
 * Legge tutte le connessioni WebSocket da DynamoDB e invia un update a tutte via API Gateway.
 * Gestisce gracefully le connessioni non valide o chiuse.
 * @param payload - Payload da inviare alle connessioni (es. WebSocketUpdate)
 */
export const broadcastUpdate = async (payload: WebSocketUpdate): Promise<void> => {
  try {
    // Valida le variabili di ambiente richieste
    const tableName = process.env.WEBSOCKET_CONNECTIONS_TABLE;
    if (!tableName) {
      console.error('Variabile di ambiente WEBSOCKET_CONNECTIONS_TABLE non configurata');
      return;
    }

    // Legge tutte le connessioni dalla tabella DynamoDB
    const scanCommand = new ScanCommand({
      TableName: tableName,
    });

    const response = await dynamoClient.send(scanCommand);
    const connections = (response.Items || []).map((item) => unmarshall(item) as WebSocketConnection);

    console.log(`Broadcasting update a ${connections.length} connessioni`);

    // Invia il payload a ogni connessione
    const messageData = JSON.stringify(payload);
    let successCount = 0;
    let failureCount = 0;

    for (const connection of connections) {
      try {
        const postCommand = new PostToConnectionCommand({
          ConnectionId: connection.connectionId,
          Data: messageData,
        });

        await apiGatewayClient.send(postCommand);
        successCount++;
      } catch (connectionError) {
        // Se la connessione è non valida o chiusa, la rimuove da DynamoDB
        if (connectionError instanceof Error && 
            (connectionError.message.includes('GoneException') || 
             connectionError.message.includes('not found'))) {
          console.warn(`Connessione chiusa, rimozione: ${connection.connectionId}`);
          
          try {
            const deleteCommand = new DeleteItemCommand({
              TableName: tableName,
              Key: marshall({ connectionId: connection.connectionId }),
            });
            await dynamoClient.send(deleteCommand);
          } catch (deleteError) {
            console.error(`Errore nella rimozione della connessione ${connection.connectionId}:`, deleteError);
          }
        } else {
          console.error(`Errore nell'invio a ${connection.connectionId}:`, connectionError);
        }
        failureCount++;
      }
    }

    console.log(`Broadcast completato: ${successCount} successi, ${failureCount} fallimenti`);
  } catch (error) {
    console.error('Errore in broadcastUpdate:', error);
  }
};
