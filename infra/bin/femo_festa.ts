#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/AuthStack';
import { ApiStack } from '../lib/stacks/ApiStack';
import { WebSocketStack } from '../lib/stacks/WebSocketStack';
import { DynamoStack } from '../lib/stacks/DynamoStack';
import { FrontendStack } from '../lib/stacks/FrontendStack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') ?? 'dev';
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-south-1',
};
const leaderboardTable = `femo-festa-leaderboard-${stage}`;
const connectionsTable = `femo-festa-connections-${stage}`;

const dynamo = new DynamoStack(app, `FemoFesta-Dynamo-${stage}`, { env, stage, leaderboardTable, connectionsTable });
const auth = new AuthStack(app, `FemoFesta-Auth-${stage}`, { env, stage });
const api = new ApiStack(app, `FemoFesta-Api-${stage}`, { env, stage, userPool: auth.userPool });
const websocket = new WebSocketStack(app, `FemoFesta-WebSocket-${stage}`, { env, stage, connectionsTable });
new FrontendStack(app, `FemoFesta-Frontend-${stage}`, { env, stage });
