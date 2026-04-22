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
}

export class WebSocketStack extends Stack {
  constructor(scope: cdk.App, id: string, props: WebSocketStackProps) {
    super(scope, id, props);
    
    const connectFn = new NodejsFunction(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocket/websocketConnect.ts',
      handler: 'connectHandler',
      environment: {
        STAGE: props.stage,
        WEBSOCKET_CONNECTIONS_TABLE: props.connectionsTable.tableName,
      }
    });

    const disconnectFn = new NodejsFunction(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocket/websocketDisconnect.ts',
      handler: 'disconnectHandler',
      environment: {
        STAGE: props.stage,
        WEBSOCKET_CONNECTIONS_TABLE: props.connectionsTable.tableName,
      }
    });

    const wsApi = new apigwv2.WebSocketApi(this, 'FemoFestaWebSocketApi', {
      apiName: `femo-festa-ws-${props.stage}`,
    });
    
    const broadcastFn = new NodejsFunction(this, 'BroadcastHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocket/websocketBroadcast.ts',
      handler: 'broadcastHandler',
      environment: {
        STAGE: props.stage,
        WEBSOCKET_CONNECTIONS_TABLE: props.connectionsTable.tableName,
        API_GATEWAY_ENDPOINT_URL: wsApi.apiEndpoint.replace(/^wss:/, 'https:')
      }
    });
    
    props.connectionsTable.grantWriteData(connectFn);
    props.connectionsTable.grantWriteData(disconnectFn);
    props.connectionsTable.grantReadData(broadcastFn);

    // broadcastFn.addToRolePolicy(new iam.PolicyStatement({
    //   actions: ['execute-api:ManageConnections'],
    //   resources: [
    //     cdk.Fn.sub('arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*', {
    //       ApiId: wsApi.apiId,
    //     }),
    //   ],
    // }));
    wsApi.addRoute('$connect', {
      integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', connectFn),
    });
    wsApi.addRoute('$disconnect', {
      integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', disconnectFn),
    });

    new apigwv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: wsApi,
      stageName: props.stage,
      autoDeploy: true,
    });

    new cdk.CfnOutput(this, 'WebSocketApiUrl', { value: wsApi.apiEndpoint });
  }
}
