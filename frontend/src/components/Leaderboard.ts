import { useWebSocket } from '../hooks/useWebSocket.ts';
import type { Team, WebSocketUpdate } from '@repo/shared';

const API_LEADERBOARD = '/leaderboard';
const WS_URL = 'wss://your-websocket-endpoint';

function renderRows(leaderboard: Team[]) {
  return leaderboard
    .map(
      (team) => `<tr><td>${team.name}</td><td>${team.score}</td></tr>`,
    )
    .join('');
}

export async function initLeaderboard(selector: string) {
  const container = document.querySelector(selector);
  if (!container) return;

  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th>Squadra</th><th>Punteggio</th></tr></thead><tbody></tbody>';
  container.appendChild(table);

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const fetchLeaderboard = async () => {
    const response = await fetch(API_LEADERBOARD);
    const data = await response.json();
    tbody.innerHTML = renderRows(data.leaderboard || []);
  };

  await fetchLeaderboard();

  useWebSocket(WS_URL, (event: WebSocketUpdate) => {
    if (event.type === 'LEADERBOARD_UPDATE') {
      tbody.innerHTML = renderRows(event.payload.leaderboard);
    }
  });
}
