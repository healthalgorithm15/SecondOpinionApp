import { io, Socket } from 'socket.io-client';
import API from '../utils/api';

class SocketService {
  private socket: Socket | null = null;
  private readonly URL = process.env.EXPO_PUBLIC_API_BaseURL;
  

  connect() {
        console.log("🔌 Attempting to connect to before:", this.URL);
    if (!this.socket) {
      console.log("🔌 Attempting to connect to:", this.URL);
      this.socket = io(this.URL, {
        transports: ['websocket'],
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log("✅ Socket Connected! ID:", this.socket?.id);
      });

      this.socket.on('connect_error', (err) => {
        console.error("❌ Socket Connection Error. Ensure your server is running and IP is correct:", err.message);
      });
    }
  }

  // 🟢 Add this: Method to listen for events
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  // 🟢 Add this: Method to stop listening
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  joinRoom(data: { userId: string; role: string }) {
  if (this.socket) {
    this.socket.emit('joinRoom', data);
    console.log(`🏠 Joining room: ${data.role} for user: ${data.userId}`);
  }
}

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();