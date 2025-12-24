import { io } from 'socket.io-client';
import { env } from '../../utils/env';

type UserType = 'admin' | 'customer' | 'seller';

class SocketServiceClass {
  private socket: any | null = null; // Use `any` to bypass the error

  get instance(): any | null {
    return this.socket;
  }


  connect(baseUrl?: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot connect socket');
      return;
    }

    // Use provided baseUrl or get from env utility (same as API service)
    const url = baseUrl || env.baseUrl || 'http://localhost:3000';
    
    if (!url) {
      console.error('Socket connection URL not found');
      return;
    }
    
    console.log('Connecting socket to:', url);

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
      // Set up force logout listener when socket is connected
      this.setupForceLogoutListener();
      // Set up order confirmed listener when socket is connected
      this.setupOrderConfirmedListener();
    });

    this.socket.on('disconnect', () => {
      console.log('User panel socket disconnected');
    });

    // Updated message listener for new backend structure
    this.socket.on('userMessage', (_payload: any) => { void _payload; });
    
    // Set up force logout listener immediately (in case socket is already connected)
    this.setupForceLogoutListener();
    // Set up order confirmed listener immediately (in case socket is already connected)
    this.setupOrderConfirmedListener();
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
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.warn('Missing user in localStorage');
        return null;
      }
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;
      
      if (!userId) {
        console.warn('Missing userId in user object');
        return null;
      }
      
      return { userId: userId.toString(), userType: 'customer' };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
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

  // Bid-specific socket methods
  joinBid(productId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('joinBid', {
      productId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  leaveBid(productId: string) {
    if (!this.socket) return;
    
    const userData = this.getUserData();
    if (!userData) return;
    
    this.socket.emit('leaveBid', {
      productId,
      userId: userData.userId,
      userType: userData.userType
    });
  }

  // Listen for bid notifications (outbid, winning_bid, etc.)
  onBidNotification(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not available for onBidNotification');
      return;
    }
    console.log('Setting up bid notification listener');
    this.socket.on('bidNotification', (data) => {
      console.log('User panel received bid notification:', data);
      callback(data);
    });
  }

  // Listen for bid updates (when someone places a bid on a product)
  onBidUpdate(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not available for onBidUpdate');
      return;
    }
    console.log('Setting up bid update listener');
    this.socket.on('bidUpdate', (data) => {
      console.log('User panel received bid update:', data);
      callback(data);
    });
  }

  // Listen for users joining bid rooms
  onUserJoinedBid(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userJoinedBid', (data) => {
      console.log('User joined bid:', data);
      callback(data);
    });
  }

  // Broadcast bid update (typically used by admin)
  broadcastBidUpdate(productId: string, updateData: any) {
    if (!this.socket) return;
    this.socket.emit('broadcastBidUpdate', {
      productId,
      updateData
    });
  }

  // Remove all bid listeners
  removeBidListeners() {
    if (!this.socket) return;
    this.socket.off('bidNotification');
    this.socket.off('bidUpdate');
    this.socket.off('userJoinedBid');
  }

  // Store the force logout callback
  private forceLogoutCallback: ((data: any) => void) | null = null;

  // Store callback for order confirmation handling
  private orderConfirmedCallback: ((data: any) => void) | null = null;

  // Set up order confirmation listener (called when socket connects)
  private setupOrderConfirmedListener() {
    if (!this.socket) {
      return;
    }
    
    // Remove existing listener if any
    this.socket.off('orderConfirmed');
    
    // Set up new listener if callback is registered
    if (this.orderConfirmedCallback) {
      console.log('Setting up order confirmed listener');
      this.socket.on('orderConfirmed', (data) => {
        console.log('Received order confirmed event:', data);
        if (this.orderConfirmedCallback) {
          this.orderConfirmedCallback(data);
        }
      });
    }
  }

  // Register callback for order confirmed event
  onOrderConfirmed(callback: (data: any) => void) {
    this.orderConfirmedCallback = callback;
    
    // If socket is already connected, set up the listener immediately
    if (this.socket && this.socket.connected) {
      this.setupOrderConfirmedListener();
    }
  }

  // Remove order confirmed listener
  removeOrderConfirmedListener() {
    if (!this.socket) return;
    this.socket.off('orderConfirmed');
    this.orderConfirmedCallback = null;
  }

  // Set up force logout listener (called when socket connects)
  private setupForceLogoutListener() {
    if (!this.socket) {
      return;
    }
    
    // Remove existing listener if any
    this.socket.off('forceLogout');
    
    // Set up new listener if callback is registered
    if (this.forceLogoutCallback) {
      console.log('Setting up force logout listener');
      this.socket.on('forceLogout', (data) => {
        console.log('Received force logout event:', data);
        if (this.forceLogoutCallback) {
          this.forceLogoutCallback(data);
        }
      });
    }
  }

  // Register callback for force logout event (e.g., when margins change)
  onForceLogout(callback: (data: any) => void) {
    this.forceLogoutCallback = callback;
    
    // If socket is already connected, set up the listener immediately
    if (this.socket && this.socket.connected) {
      this.setupForceLogoutListener();
    }
  }

  // Remove force logout listener
  removeForceLogoutListener() {
    if (!this.socket) return;
    this.socket.off('forceLogout');
    this.forceLogoutCallback = null;
  }
}

export const SocketService = new SocketServiceClass();


