import type { Team, WebSocketUpdate } from '@repo/shared';

const WS_URL = import.meta.env.PUBLIC_WS_URL 
  ? `${import.meta.env.PUBLIC_WS_URL}`
  : 'wss://boh';
console.log(import.meta.env.PUBLIC_WS_URL);
console.log(WS_URL);

export type MessageHandler = (payload: any) => void;

export function useWebSocket(url: string, onMessage: MessageHandler) {
  let socket: WebSocket | null = null;

  const connect = () => {
    socket = new WebSocket(url);
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.warn('WebSocket parse failed', error);
      }
    });
    socket.addEventListener('close', () => {
      setTimeout(connect, 2000);
    });
  };

  connect();

  return {
    close: () => {
      if (socket) {
        socket.close();
      }
    },
  };
}

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
