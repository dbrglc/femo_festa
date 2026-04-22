import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface DynamoStackProps extends StackProps {
  stage: string;
  leaderboardTable: string;
  connectionsTable: string;
}

export class DynamoStack extends Stack {
  public readonly leaderboardTable: dynamodb.Table;
  public readonly connectionsTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props: DynamoStackProps) {
    super(scope, id, props);

    this.leaderboardTable = new dynamodb.Table(this, 'LeaderboardTable', {
      tableName: `${props.leaderboardTable}`,
      partitionKey: { name: 'teamName', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: `${props.connectionsTable}`,
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'LeaderboardTableName', { value: this.leaderboardTable.tableName });
    new cdk.CfnOutput(this, 'ConnectionsTableName', { value: this.connectionsTable.tableName });
  }
}
