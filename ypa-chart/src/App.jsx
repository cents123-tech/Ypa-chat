// App.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Registration from './Registration';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import './App.css';

const SOCKET_URL = 'http://localhost:5000';

// ============ MAIN APP ============
function App() {
  const [screen, setScreen] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? 'loading' : 'login';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && screen === 'loading') {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setScreen(user.role === 'admin' ? 'admin' : 'user');
      } catch (err) {
        localStorage.removeItem('user');
        setScreen('login');
      }
    }
  }, [screen]);

  useEffect(() => {
    if (currentUser && !socket) {
      const newSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('✓ Connected to server');
        newSocket.emit('user_join', currentUser);
      });

      newSocket.on('connect_error', (error) => {
        console.error('✗ Connection error:', error);
      });

      setSocket(newSocket);

      return () => newSocket.disconnect();
    }
  }, [currentUser, socket]);

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSocket(null);
    setCurrentUser(null);
    setScreen('login');
  };

  return (
    <>
      {screen === 'login' && <Login onSwitch={() => setScreen('registration')} />}
      {screen === 'registration' && <Registration onSwitch={() => setScreen('login')} />}
      {screen === 'user' && currentUser && (
        <UserDashboard user={currentUser} socket={socket} onLogout={handleLogout} />
      )}
      {screen === 'admin' && currentUser && (
        <AdminDashboard user={currentUser} socket={socket} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;