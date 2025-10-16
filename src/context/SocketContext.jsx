import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SocketService } from '../services/socket/socket';

const SocketContext = createContext({ socket: null, socketService: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [socketService, setSocketService] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      SocketService.connect();
      setSocket(SocketService.instance);
      setSocketService(SocketService);
    }

    const onStorage = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          SocketService.connect();
          setSocket(SocketService.instance);
          setSocketService(SocketService);
        } else {
          SocketService.disconnect();
          setSocket(null);
          setSocketService(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ socket, socketService }), [socket, socketService]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}


