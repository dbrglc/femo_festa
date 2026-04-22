import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; 
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface WebSocketStackProps extends StackProps {
  stage: string;
  connectionsTable: dynamodb.Table;
  leaderboardTable: dynamodb.Table;
}

export class WebSocketStack extends Stack {
  public readonly broadcastFunction: lambda.Function;

  constructor(scope: cdk.App, id: string, props: WebSocketStackProps) {
    super(scope, id, props);

    const wsApi = new apigwv2.WebSocketApi(this, 'FemoFestaWebSocketApi', {
      apiName: `femo-festa-ws-${props.stage}`,
    });

    // Handler per il broadcast dei messaggi WebSocket
    
    this.broadcastFunction = new NodejsFunction(this, 'BroadcastHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocket/websocketBroadcast.ts',
      handler: 'broadcastHandler',
      bundling: {
        minify: false,
        sourceMap: false,
        externalModules: []
      },
      environment: {
        STAGE: props.stage,
        WEBSOCKET_CONNECTIONS_TABLE: props.connectionsTable.tableName,
        LEADERBOARD_TABLE: props.leaderboardTable.tableName,
        API_GATEWAY_ENDPOINT_URL: `https://${wsApi.apiId}.execute-api.${this.region}.amazonaws.com/${props.stage}`
      }
    });

    props.connectionsTable.grantReadData(this.broadcastFunction);
    props.leaderboardTable.grantReadData(this.broadcastFunction);

    wsApi.grantManageConnections(this.broadcastFunction);

    // Crea lo stage per l'API WebSocket

    // Handler per la connessione WebSocket
    
    const connectFn = new NodejsFunction(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocket/websocketConnect.ts',
      handler: 'connectHandler',
      bundling: {
        minify: false,
        sourceMap: false,
        externalModules: []
      },
      environment: {
        STAGE: props.stage,
          WEBSOCKET_CONNECTIONS_TABLE: props.connectionsTable.tableName,
          LEADERBOARD_TABLE: props.leaderboardTable.tableName,
          BROADCAST_FUNCTION_NAME: this.broadcastFunction.functionName,
      }
    });

    props.connectionsTable.grantWriteData(connectFn);
    props.leaderboardTable.grantReadData(connectFn);

    wsApi.grantManageConnections(connectFn);

    wsApi.addRoute('$connect', {
      integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', connectFn),
    });

    // Handler per la disconnessione WebSocket

    const disconnectFn = new NodejsFunction(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocket/websocketDisconnect.ts',
      handler: 'disconnectHandler',
      bundling: {
        minify: false,
        sourceMap: false,
        externalModules: []
      },
      environment: {
        STAGE: props.stage,
        WEBSOCKET_CONNECTIONS_TABLE: props.connectionsTable.tableName,
      }
    });

    props.connectionsTable.grantWriteData(disconnectFn);

    wsApi.addRoute('$disconnect', {
      integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', disconnectFn),
    });

    new apigwv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: wsApi,
      stageName: props.stage,
      autoDeploy: true,
    });

    // Output dell'URL dell'API WebSocket

    new cdk.CfnOutput(this, 'WebSocketApiUrl', { value: wsApi.apiEndpoint });
  }
}
