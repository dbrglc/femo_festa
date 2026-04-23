import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { Order, WebSocketUpdate, Team } from '@repo/shared';

// Inizializza client AWS
const region = process.env.AWS_REGION || 'eu-south-1';
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;
    const order = body as Order;

    if (!order?.teamName || typeof order.score !== 'number') {
      return { statusCode: 400, body: 'Payload non valido' };
    }

    const tableNameLeaderboard = process.env.LEADERBOARD_TABLE_NAME;
    if (!tableNameLeaderboard) {
      console.error('Variabile di ambiente LEADERBOARD_TABLE_NAME non configurata');
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

    // Incrementa lo score del team (crea se non esiste con score = 0)
    const updateCommand = new UpdateItemCommand({
      TableName: tableNameLeaderboard,
      Key: marshall({ teamName: order.teamName }),
      UpdateExpression: 'SET #score = if_not_exists(#score, :zero) + :increment, #updatedTime = :now',
      ExpressionAttributeNames: {
        '#score': 'score',
        '#updatedTime': 'updatedTime',
      },
      ExpressionAttributeValues: marshall({
        ':increment': order.score,
        ':now': new Date().toISOString(),
        ':zero': 0,
      }),
      ReturnValues: 'ALL_NEW',
    });

    const updateResponse = await dynamoClient.send(updateCommand);
    const updatedTeam = updateResponse.Attributes ? unmarshall(updateResponse.Attributes) : null;

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
      body: JSON.stringify({ message: 'Ordine accettato', order, updatedTeam }),
    };
  } catch (error) {
    console.error('Errore nel submitOrder:', error);
    return { statusCode: 401, body: 'Token non valido' };
  }
};
