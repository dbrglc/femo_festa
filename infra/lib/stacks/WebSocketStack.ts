import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'; 

interface WebSocketStackProps extends StackProps {
  stage: string;
}

export class WebSocketStack extends Stack {
  constructor(scope: cdk.App, id: string, props: WebSocketStackProps) {
    super(scope, id, props);
    
    const connectFn = new NodejsFunction(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocketHandlers.ts',
      handler: 'connectHandler'
    });

    const disconnectFn = new NodejsFunction(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/websocketHandlers.ts',
      handler: 'disconnectHandler'
    });

    const wsApi = new apigwv2.WebSocketApi(this, 'FemoFestaWebSocketApi', {
      apiName: `femo-festa-ws-${props.stage}`,
    });

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
