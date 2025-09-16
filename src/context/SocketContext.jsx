import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SocketService } from '../services/socket/socket';

const SocketContext = createContext({ socket: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      SocketService.connect();
      setSocket(SocketService.instance);
    }

    const onStorage = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          SocketService.connect();
          setSocket(SocketService.instance);
        } else {
          SocketService.disconnect();
          setSocket(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}


