import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface ApiStackProps extends StackProps {
  stage: string;
  userPool: cognito.UserPool;
}

export class ApiStack extends Stack {
  constructor(scope: cdk.App, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const apiLambda = new lambda.Function(this, 'LeaderboardFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getLeaderboard.handler',
      code: lambda.Code.fromAsset('../../backend/dist'),
      environment: {
        STAGE: props.stage,
      },
    });

    const ordersLambda = new lambda.Function(this, 'SubmitOrderFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'submitOrder.handler',
      code: lambda.Code.fromAsset('../../backend/dist'),
      environment: {
        STAGE: props.stage,
      },
    });

    const httpApi = new apigwv2.HttpApi(this, 'FemoFestaHttpApi', {
      apiName: `femo-festa-http-${props.stage}`,
      createDefaultStage: true,
    });

    httpApi.addRoutes({
      path: '/leaderboard',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('LeaderboardIntegration', apiLambda),
    });

    httpApi.addRoutes({
      path: '/orders',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('OrdersIntegration', ordersLambda),
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.apiEndpoint });
  }
}
