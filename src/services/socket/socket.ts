import { io, Socket } from 'socket.io-client';

type UserType = 'admin' | 'customer' | 'seller';

class SocketServiceClass {
  private socket: Socket | null = null;

  get instance(): Socket | null {
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
      // connected
    });

    this.socket.on('disconnect', () => {
      // disconnected
    });

    this.socket.on('adminMessage', (_payload: any) => { void _payload; });
    this.socket.on('customerMessage', (_payload: any) => { void _payload; });
    this.socket.on('sellerMessage', (_payload: any) => { void _payload; });
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.removeAllListeners(); } catch {}
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }
  }

  emitToType(userType: UserType, message: string) {
    if (!this.socket) return;
    this.socket.emit('sendToType', { userType, message });
  }
}

export const SocketService = new SocketServiceClass();


