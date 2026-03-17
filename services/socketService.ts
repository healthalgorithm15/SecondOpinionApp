import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  
  // 🌐 Production URL (Azure handles the port 5000 -> 443 mapping automatically)
  private readonly URL = process.env.EXPO_PUBLIC_API_BaseURL || 
    'https://healthalgorithm-a5aqe6ckgzdmb0cf.southindia-01.azurewebsites.net';

  /**
   * 🟢 Connect to the socket server
   * @param token - Optional JWT token for authentication
   */
  connect(token?: string) {
    // If socket exists and is already connected, don't recreate it
    if (this.socket?.connected) {
      console.log("🔌 Socket already connected.");
      return;
    }

    console.log("🔌 Initializing Socket Connection to:", this.URL);

  this.socket = io(this.URL, {
      transports: ['polling', 'websocket'], // 🟢 Try polling first, then upgrade to websocket
      auth: { token },            
      forceNew: true,
      secure: true,               
      timeout: 30000,                // 30 seconds for slower mobile networks
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,       // Wait 2s between tries
    });

    // --- 📡 Standard Events ---
    this.socket.on('connect', () => {
      console.log("✅ Socket Connected! ID:", this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error("❌ Socket Connection Error:", err.message);
      // If it's a transport error, it might be a CORS or Port issue on Azure
      if (err.message === 'xhr poll error') {
          console.warn("⚠️ Hint: Check if Azure App Service has 'WebSockets' enabled in Configuration.");
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log("🔌 Socket Disconnected. Reason:", reason);
    });

    // --- 🛠️ Manager Events (Deep Debugging) ---
    this.socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnecting... attempt: ${attempt}`);
    });

    this.socket.io.on("reconnect_error", (error) => {
      console.error("❌ Reconnection Failed:", error);
    });
  }

  /**
   * 🟢 Listen for server events (e.g., 'caseCompleted')
   */
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
  }

  /**
   * 🟢 Stop listening to an event
   */
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  /**
   * 🏠 Join a specific room based on Role (Patient/Doctor)
   */
  joinRoom(data: { userId: string; role: string }) {
    if (this.socket?.connected) {
      this.socket.emit('joinRoom', data);
      console.log(`🏠 Room Joined: ${data.role} (User: ${data.userId})`);
    } else {
      console.warn("⚠️ Cannot join room: Socket not connected yet.");
    }
  }

  /**
   * 🚪 Clean up connection
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Manually disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();