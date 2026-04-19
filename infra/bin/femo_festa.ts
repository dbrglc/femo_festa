#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/AuthStack.js';
import { ApiStack } from '../lib/stacks/ApiStack.js';
import { WebSocketStack } from '../lib/stacks/WebSocketStack.js';
import { DynamoStack } from '../lib/stacks/DynamoStack.js';
import { FrontendStack } from '../lib/stacks/FrontendStack.js';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') ?? 'dev';
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const dynamo = new DynamoStack(app, `FemoFesta-Dynamo-${stage}`, { env, stage });
const auth = new AuthStack(app, `FemoFesta-Auth-${stage}`, { env, stage });
const api = new ApiStack(app, `FemoFesta-Api-${stage}`, { env, stage, userPool: auth.userPool });
const websocket = new WebSocketStack(app, `FemoFesta-WebSocket-${stage}`, { env, stage });
new FrontendStack(app, `FemoFesta-Frontend-${stage}`, { env, stage });
