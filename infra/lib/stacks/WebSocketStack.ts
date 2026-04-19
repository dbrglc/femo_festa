import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

interface WebSocketStackProps extends StackProps {
  stage: string;
}

export class WebSocketStack extends Stack {
  constructor(scope: cdk.App, id: string, props: WebSocketStackProps) {
    super(scope, id, props);

    const connectFn = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'websocketHandlers.connectHandler',
      code: lambda.Code.fromAsset('../../backend/dist'),
    });

    const disconnectFn = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'websocketHandlers.disconnectHandler',
      code: lambda.Code.fromAsset('../../backend/dist'),
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

    new cdk.CfnOutput(this, 'WebSocketApiUrl', { value: wsApi.apiEndpoint });
  }
}
