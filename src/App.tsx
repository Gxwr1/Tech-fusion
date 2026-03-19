import React from 'react';
import { SocketProvider } from './context/SocketContext';
import Admin1Panel from './components/Admin1Panel';
import Admin2Panel from './components/Admin2Panel';
import PlayerView from './components/PlayerView';

const App: React.FC = () => {
  const path = window.location.pathname;
  
  return (
    <SocketProvider>
      {path === '/admin1' ? <Admin1Panel /> : 
       path === '/admin2' ? <Admin2Panel /> : 
       <PlayerView />}
    </SocketProvider>
  );
};

export default App;
