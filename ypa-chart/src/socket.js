// src/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  transports: ['websocket'],
  autoConnect: true
});

export default socket;