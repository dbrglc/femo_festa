import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface AuthStackProps extends StackProps {
  stage: string;
}

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly appClient: cognito.UserPoolClient;

  constructor(scope: cdk.App, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'FemoFestaUserPool', {
      userPoolName: `femo-festa-${props.stage}-users`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.appClient = this.userPool.addClient('FemoFestaAppClient', {
      authFlows: { userPassword: true },
      oAuth: {
        callbackUrls: ['https://your-frontend-domain/order'],
        logoutUrls: ['https://your-frontend-domain'],
        flows: { implicitCodeGrant: true },
      },
      generateSecret: false,
    });

    new cognito.UserPoolDomain(this, 'FemoFestaCognitoDomain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `femo-festa-${props.stage}`,
      },
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'ClientId', { value: this.appClient.userPoolClientId });
  }
}
