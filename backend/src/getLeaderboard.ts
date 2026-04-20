import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { Team } from '@shared/types.ts';

const sampleLeaderboard: Team[] = [
  { name: 'Team A', score: 320 },
  { name: 'Team B', score: 270 },
  { name: 'Team C', score: 220 },
];

export const handler = async (
  _event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ leaderboard: sampleLeaderboard }),
  };
};
