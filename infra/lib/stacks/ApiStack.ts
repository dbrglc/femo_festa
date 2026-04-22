import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ApiStackProps extends StackProps {
  stage: string;
  userPool: cognito.UserPool;
}

export class ApiStack extends Stack {
  constructor(scope: cdk.App, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const ordersLambda = new NodejsFunction(this, 'SubmitOrderFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: '../backend/src/submitOrder.ts',
      handler: 'handler',
      environment: {
        STAGE: props.stage,
      },
    });

    const httpApi = new apigwv2.HttpApi(this, 'FemoFestaHttpApi', {
      apiName: `femo-festa-http-${props.stage}`,
      createDefaultStage: true,
    });

    httpApi.addRoutes({
      path: '/orders',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('OrdersIntegration', ordersLambda),
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.apiEndpoint });
  }
}
