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

    const siteBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `femo-festa-frontend-${props.stage}`,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', { value: siteBucket.bucketName });
  }
}
