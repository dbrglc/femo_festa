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
