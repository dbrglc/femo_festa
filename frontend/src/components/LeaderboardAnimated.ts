import type { Team, WebSocketUpdate } from '@repo/shared';

const WS_URL = import.meta.env.PUBLIC_WS_URL 
  ? `${import.meta.env.PUBLIC_WS_URL}`
  : 'wss://boh';

export type MessageHandler = (payload: any) => void;

interface TeamState {
  position: number;
  score: number;
}

interface TeamWithAnimation extends Team {
  position: number;
  animationClass?: string;
}

// Track state per rilevare cambio posizione
let lastState: Map<string, TeamState> = new Map();

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
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
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

/**
 * Calcola se un team è salito o sceso di posizione
 */
function calculatePositionChange(
  teamId: string,
  newPosition: number,
  newScore: number,
): string {
  const lastTeamState = lastState.get(teamId);
  
  if (!lastTeamState) {
    // Nuovo team o primo render
    return '';
  }

  const positionChange = lastTeamState.position - newPosition;
  
  if (positionChange > 0) {
    // Team è salito (posizione numericamente minore)
    return 'animate-rise';
  } else if (positionChange < 0) {
    // Team è sceso (posizione numericamente maggiore)
    return 'animate-fall';
  } else if (lastTeamState.score !== newScore) {
    // Score cambiato ma posizione è la stessa
    return 'animate-score-change';
  }

  return '';
}

/**
 * Renderizza HTML per il podio (top 3)
 */
function renderPodium(top3: TeamWithAnimation[]): string {
  // Ordina per ottenere 1°, 2°, 3° (1° al centro, 2° a sx, 3° a dx)
  const first = top3[0];
  const second = top3[1] || null;
  const third = top3[2] || null;

  let html = '<div class="podium-container">';

  // Posizione 2° (sinistra)
  if (second) {
    const heightClass = 'podium-bar-second';
    html += `
      <div class="podium-slot podium-left ${second.animationClass || ''}">
        <div class="podium-bar ${heightClass}">
          <div class="podium-content">
            <div class="podium-rank">2°</div>
            <div class="podium-name">${second.name}</div>
            <div class="podium-score"><span class="score-value">${second.score}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  // Posizione 1° (centro) - con corona
  if (first) {
    const heightClass = 'podium-bar-first';
    html += `
      <div class="podium-slot podium-center ${first.animationClass || ''}">
        <div class="podium-crown">👑</div>
        <div class="podium-bar ${heightClass}">
          <div class="podium-content">
            <div class="podium-rank">1°</div>
            <div class="podium-name">${first.name}</div>
            <div class="podium-score"><span class="score-value">${first.score}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  // Posizione 3° (destra)
  if (third) {
    const heightClass = 'podium-bar-third';
    html += `
      <div class="podium-slot podium-right ${third.animationClass || ''}">
        <div class="podium-bar ${heightClass}">
          <div class="podium-content">
            <div class="podium-rank">3°</div>
            <div class="podium-name">${third.name}</div>
            <div class="podium-score"><span class="score-value">${third.score}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Renderizza HTML per la lista di ranking (dal 4° in poi)
 */
function renderRankingList(restTeams: TeamWithAnimation[]): string {
  if (restTeams.length === 0) {
    return '';
  }

  const rows = restTeams
    .map(
      (team) => `
      <div class="ranking-row ${team.animationClass || ''}">
        <div class="ranking-rank">${team.position}°</div>
        <div class="ranking-name">${team.name}</div>
        <div class="ranking-score"><span class="score-value">${team.score}</span></div>
      </div>
    `,
    )
    .join('');

  return `<div class="ranking-list">${rows}</div>`;
}

/**
 * Aggiunge classe di animazione ai team che cambiano
 */
function enrichTeamsWithAnimations(teams: Team[]): TeamWithAnimation[] {
  return teams.map((team, index) => {
    const position = index + 1;
    const animationClass = calculatePositionChange(team.name, position, team.score);
    
    // Aggiorna lastState
    lastState.set(team.name, { position, score: team.score });
    
    return {
      ...team,
      position,
      animationClass,
    };
  });
}

export async function initLeaderboard(selector: string) {
  const container = document.querySelector(selector);
  if (!container) {
    console.error(`Container with selector "${selector}" not found`);
    return;
  }

  // Inizializza il container
  container.innerHTML = '<div id="podium-section"></div><div id="ranking-section"></div>';
  const podiumSection = container.querySelector('#podium-section') as HTMLElement;
  const rankingSection = container.querySelector('#ranking-section') as HTMLElement;

  if (!podiumSection || !rankingSection) {
    console.error('Could not find podium or ranking sections');
    return;
  }

  /**
   * Aggiorna il rendering della leaderboard
   */
  const updateLeaderboard = (leaderboard: Team[]) => {
    if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
      console.warn('Invalid or empty leaderboard data');
      return;
    }

    // Arricchisci team con animazioni e posizioni
    const enrichedTeams = enrichTeamsWithAnimations(leaderboard);
    
    // Separa top 3 dal resto
    const top3 = enrichedTeams.slice(0, 3);
    const restTeams = enrichedTeams.slice(3);

    // Renderizza podium
    podiumSection.innerHTML = renderPodium(top3);

    // Renderizza ranking list
    rankingSection.innerHTML = renderRankingList(restTeams);

    // Triggera reflow per forzare animazione CSS
    void podiumSection.offsetHeight;
    void rankingSection.offsetHeight;
  };

  // Connette WebSocket e gestisce aggiornamenti real-time
  const socket = useWebSocket(WS_URL, (message: WebSocketUpdate) => {
    try {
      if (message.type === 'LEADERBOARD_UPDATE' && message.payload?.leaderboard) {
        const leaderboard = message.payload.leaderboard;
        updateLeaderboard(leaderboard);
      }
    } catch (error) {
      console.warn('Error processing WebSocket message:', error);
    }
  });

  // Fetch iniziale della leaderboard
  try {
    const apiUrl = import.meta.env.PUBLIC_API_URL || 'https://api.example.com';
    const response = await fetch(`${apiUrl}/leaderboard`);
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.leaderboard) {
      updateLeaderboard(data.leaderboard);
    }
  } catch (error) {
    console.error('Error fetching initial leaderboard:', error);
  }

  // Ritorna una funzione per il cleanup
  return {
    close: () => {
      socket.close();
    },
  };
}
