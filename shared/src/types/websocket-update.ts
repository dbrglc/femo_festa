import { Team } from './team.js';

export interface WebSocketUpdate {
  type: 'LEADERBOARD_UPDATE';
  payload: {
    leaderboard: Team[];
  };
}