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
      console.log('User panel socket connected:', this.socket?.id);
      // Auto-join room when connected
      this.joinRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('User panel socket disconnected');
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
    if (!this.socket) {
      console.warn('Socket not available for joinRoom');
      return;
    }
    
    const userData = this.getUserData();
    if (!userData) {
      console.warn('User data not available for joinRoom');
      return;
    }
    
    console.log('User panel joining room with data:', userData);
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

  // Negotiation-specific socket methods
  joinNegotiation(negotiationId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('joinNegotiation', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  leaveNegotiation(negotiationId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('leaveNegotiation', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Listen for negotiation notifications
  onNegotiationNotification(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not available for onNegotiationNotification');
      return;
    }
    console.log('Setting up negotiation notification listener');
    this.socket.on('negotiationNotification', (data) => {
      console.log('User panel received negotiation notification:', data);
      callback(data);
    });
  }

  // Listen for negotiation broadcasts
  onNegotiationBroadcast(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not available for onNegotiationBroadcast');
      return;
    }
    console.log('Setting up negotiation broadcast listener');
    this.socket.on('negotiationBroadcast', (data) => {
      console.log('User panel received negotiation broadcast:', data);
      callback(data);
    });
  }

  // Listen for negotiation updates
  onNegotiationUpdate(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not available for onNegotiationUpdate');
      return;
    }
    console.log('Setting up negotiation update listener');
    this.socket.on('negotiationUpdate', (data) => {
      console.log('User panel received negotiation update:', data);
      callback(data);
    });
  }

  // Listen for user joining/leaving negotiations
  onUserJoinedNegotiation(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userJoinedNegotiation', callback);
  }

  onUserLeftNegotiation(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userLeftNegotiation', callback);
  }

  // Listen for typing indicators
  onUserTyping(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userTyping', callback);
  }

  // Send typing indicator
  sendNegotiationTyping(negotiationId: string, isTyping: boolean) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('negotiationTyping', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType,
      isTyping
    });
  }

  // Mark negotiation as read
  markNegotiationRead(negotiationId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('markNegotiationRead', {
      negotiationId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Remove all negotiation listeners
  removeNegotiationListeners() {
    if (!this.socket) return;
    this.socket.off('negotiationNotification');
    this.socket.off('negotiationBroadcast');
    this.socket.off('negotiationUpdate');
    this.socket.off('userJoinedNegotiation');
    this.socket.off('userLeftNegotiation');
    this.socket.off('userTyping');
    this.socket.off('negotiationRead');
  }
}

export const SocketService = new SocketServiceClass();


