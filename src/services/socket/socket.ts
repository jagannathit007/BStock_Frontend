import { io } from 'socket.io-client';

type UserType = 'admin' | 'customer' | 'seller';

class SocketServiceClass {
  private socket: any | null = null; // Use `any` to bypass the error

  get instance(): any | null {
    return this.socket;
  }


  connect(baseUrl?: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = baseUrl || (import.meta.env.VITE_BASE_URL as string);
    if (!url) return;

    if (this.socket) {
      if (this.socket.connected) return;
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // Auto-join room when connected
      this.joinRoom();
    });

    this.socket.on('disconnect', () => {
      // disconnected
    });

    // Updated message listener for new backend structure
    this.socket.on('userMessage', (_payload: any) => { void _payload; });
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.removeAllListeners(); } catch {}
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }
  }

  // Get user data from localStorage
  private getUserData(): { userId: string; userType: UserType } | null {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.warn('Missing userId in localStorage');
      return null;
    }
    
    return { userId, userType: 'customer' }; // Assuming userType is always 'customer' for this example
  }

  // Join room with userId and userType
  joinRoom() {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('joinRoom', {
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Leave room
  leaveRoom() {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('leaveRoom', {
      userId: userData.userId,
      userType: userData.userType
    });
  }

  emitToType(userType: UserType, message: string) {
    if (!this.socket) return;
    this.socket.emit('sendToType', { userType, message });
  }
}

export const SocketService = new SocketServiceClass();


