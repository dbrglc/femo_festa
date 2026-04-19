export interface Team {
  name: string;
  score: number;
}

export interface Order {
  teamName: string;
  score: number;
}

export interface WebSocketUpdate {
  type: 'LEADERBOARD_UPDATE';
  payload: {
    leaderboard: Team[];
  };
}
