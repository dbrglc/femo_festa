import { useWebSocket } from '../hooks/useWebSocket.ts';
import type { Team, WebSocketUpdate } from '@repo/shared';

const API_LEADERBOARD = '/leaderboard';
const WS_URL = import.meta.env.PUBLIC_WS_URL || 'wss://{{WS_ENDPOINT}}';

function renderRows(leaderboard: Team[]) {
  return leaderboard
    .map(
      (team) => `<tr><td>${team.name}</td><td>${team.score}</td></tr>`,
    )
    .join('');
}

export async function initLeaderboard(selector: string) {
  const container = document.querySelector(selector);
  if (!container) {
    console.error(`Container with selector "${selector}" not found`);
    return;
  }

  // Crea la struttura della tabella
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Squadra</th>
        <th>Punteggio</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  container.appendChild(table);

  const tbody = table.querySelector('tbody');
  if (!tbody) {
    console.error('Could not find tbody element');
    return;
  }

  // Fetch iniziale della leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(API_LEADERBOARD);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const leaderboard = Array.isArray(data) ? data : data.leaderboard || [];
      tbody.innerHTML = renderRows(leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: red;">Errore nel caricamento</td></tr>';
    }
  };

  // Carica la leaderboard al init
  await fetchLeaderboard();

  // Connette WebSocket e gestisce aggiornamenti real-time
  const socket = useWebSocket(WS_URL, (message: WebSocketUpdate) => {
    try {
      if (message.type === 'LEADERBOARD_UPDATE' && message.payload?.leaderboard) {
        const leaderboard = message.payload.leaderboard;
        if (Array.isArray(leaderboard)) {
          tbody.innerHTML = renderRows(leaderboard);
        }
      }
    } catch (error) {
      console.warn('Error processing WebSocket message:', error);
    }
  });

  // Ritorna una funzione per il cleanup
  return {
    close: () => {
      socket.close();
    },
  };
}

// Uso nel page component:
// import { initLeaderboard } from '../components/Leaderboard.ts';
// const leaderboard = await initLeaderboard('#leaderboard-container');
// // Cleanup se necessario: leaderboard?.close();
