import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { WebSocketConnection, Team, WebSocketUpdate } from "@repo/shared";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const region = process.env.AWS_REGION || 'eu-south-1';
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });

/**
 * Handler per la connessione WebSocket.
 * Memorizza la nuova connessione su DynamoDB con timestamp e metadata.
 */
export const connectHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Valida le variabili di ambiente richieste
    const tableNameConnections = process.env.WEBSOCKET_CONNECTIONS_TABLE;
    if (!tableNameConnections) {
      console.error('Variabile di ambiente WEBSOCKET_CONNECTIONS_TABLE non configurata');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configurazione server mancante' })
      };
    }

    const tableNameLeaderboard = process.env.LEADERBOARD_TABLE;
    if (!tableNameLeaderboard) {
      console.error('Variabile di ambiente LEADERBOARD_TABLE non configurata');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configurazione server mancante' })
      };
    }

    const broadcastFunctionName = process.env.BROADCAST_FUNCTION_NAME;
    if (!broadcastFunctionName) {
      console.error('Variabile di ambiente BROADCAST_FUNCTION_NAME non configurata');
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
      TableName: tableNameConnections,
      Item: marshall(connection),
    });

    await dynamoClient.send(command);
    console.log(`Connessione WebSocket stabilita: ${connectionId}`);

    // Leggi tutti i team dalla tabella per il broadcast
    const scanCommand = new ScanCommand({
      TableName: tableNameLeaderboard,
    });

    const scanResponse = await dynamoClient.send(scanCommand);
    const allTeams: Team[] = (scanResponse.Items || [])
      .map((item) => {
        const data = unmarshall(item) as any;
        return {
          name: data.teamName,
          score: data.score,
          updatedAt: data.updatedTime,
        };
      })
      // Ordina per score decrescente
      .sort((a, b) => b.score - a.score);

      // Invoca la Lambda di broadcast con l'update
      const broadcastPayload: WebSocketUpdate = {
        type: 'LEADERBOARD_UPDATE',
        payload: {
          leaderboard: allTeams,
        },
      };
  
      const invokeCommand = new InvokeCommand({
        FunctionName: broadcastFunctionName,
        InvocationType: 'Event',
        Payload: JSON.stringify(broadcastPayload),
      });
  
      await lambdaClient.send(invokeCommand);

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