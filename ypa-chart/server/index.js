require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ypa-secret-key-2024';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ============ SOCKET.IO CONFIG ============
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ============ MIDDLEWARE ============
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// ============ IN-MEMORY DATABASE ============
let users = [
  { 
    id: 'admin1', 
    username: 'Admin', 
    email: 'admin@ypa.com', 
    password: '12345', 
    role: 'admin', 
    profilePicture: null, 
    online: false 
  },
  { 
    id: 'user1', 
    username: 'John Doe', 
    email: 'user@ypa.com', 
    password: '123', 
    role: 'user', 
    profilePicture: null, 
    online: false 
  }
];

let messages = [];
let connectedUsers = {};

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ status: '✓ Server running', timestamp: new Date() });
});

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, role, profilePicture } = req.body;

    console.log('📝 REGISTER REQUEST:', { username, email, role });

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, msg: 'All fields required' });
    }

    const userExists = users.find(u => u.email === email);
    if (userExists) {
      return res.status(400).json({ success: false, msg: 'Email already registered' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      username,
      email,
      password,
      role: role || 'user',
      profilePicture: profilePicture || null,
      online: false
    };

    users.push(newUser);
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    console.log(`✅ User registered: ${email} (${role})`);
    console.log(`📊 Total users now: ${users.length}`);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email, 
        role: newUser.role, 
        profilePicture: newUser.profilePicture 
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, msg: 'Email and password required' });
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(400).json({ success: false, msg: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    console.log(`✓ User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        profilePicture: user.profilePicture 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// ============ GET ALL USERS ============
app.get('/api/users', (req, res) => {
  try {
    const allUsers = users
      .filter(u => u.role === 'user')
      .map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture,
        online: Object.values(connectedUsers).some(cu => cu.id === u.id)
      }));

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ============ GET ALL MESSAGES ============
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// ============ SOCKET.IO EVENTS ============
io.on('connection', (socket) => {
  console.log(`✓ Socket connected: ${socket.id}`);

  socket.on('user_join', (user) => {
    connectedUsers[user.id] = { ...user, socketId: socket.id };
    
    const onlineUsers = users.map(u => ({
      ...u,
      online: Object.values(connectedUsers).some(cu => cu.id === u.id)
    }));

    io.emit('load_users', onlineUsers);
    io.emit('user_status_update', { userId: user.id, online: true });
    
    // 🔔 NOTIFY ADMIN THAT USER LOGGED IN
    if (user.role === 'user') {
      io.emit('user_login_notification', {
        message: `${user.username} has logged in and is ready to chat!`,
        username: user.username,
        userId: user.id,
        timestamp: new Date()
      });
      console.log(`🔔 Notifying admin: ${user.username} logged in`);
    }
    
    // Send ALL messages to this user
    socket.emit('load_messages', messages);
    
    console.log(`✓ ${user.username} joined (${user.role})`);
  });

  socket.on('send_message', (data) => {
    const { text, recipientId, sender, media, senderRole } = data;

    console.log('📨 MESSAGE RECEIVED:', { text, sender, recipientId, senderRole });

    const message = {
      id: `msg_${Date.now()}`,
      text: text || '',
      media: media || null,
      sender,
      senderId: sender,
      recipientId,
      senderRole: senderRole || 'user',
      timestamp: new Date().toISOString()
    };

    messages.push(message);
    
    console.log(`✅ MESSAGE SAVED - Total: ${messages.length}`);

    // Broadcast to ALL clients
    io.emit('receive_message', message);
    
    console.log(`✓ Broadcasted to all clients`);
  });

  socket.on('user_typing', (data) => {
    socket.broadcast.emit('user_typing', data);
  });

  socket.on('delete_user', (userId) => {
    users = users.filter(u => u.id !== userId);
    delete connectedUsers[userId];
    io.emit('user_deleted', userId);
    console.log(`✓ User ${userId} deleted`);
  });

  socket.on('disconnect', () => {
    const disconnectUser = Object.values(connectedUsers).find(u => u.socketId === socket.id);
    if (disconnectUser) {
      delete connectedUsers[disconnectUser.id];
      io.emit('user_status_update', { userId: disconnectUser.id, online: false });
      console.log(`✗ ${disconnectUser.username} disconnected`);
    }
  });
});

// ============ START SERVER ============
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ✓ YPA Server Running                 ║
║   ✓ Port: ${PORT}                        ║
║   ✓ Users: ${users.length}                        ║
║   ✓ Socket.IO Active                   ║
╚════════════════════════════════════════╝
  `);
});