import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

interface FrontendStackProps extends StackProps {
  stage: string;
}

export class FrontendStack extends Stack {
  constructor(scope: cdk.App, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    // 1. S3 BUCKET PRIVATO (NO website hosting)
    const siteBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `femo-festa-frontend-${props.stage}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: 'Frontend OAC',
    });

    const origin = origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
      originAccessControl: oac,
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    siteBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': distribution.distributionArn,
        },
      },
    }));

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: siteBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
    });
  }
}