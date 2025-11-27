require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============ CONNECT TO MONGODB ATLAS ============
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true
})
  .then(() => console.log("✓ MongoDB Atlas Connected Successfully"))
  .catch(err => {
    console.error("✗ MongoDB connection error:", err.message);
    process.exit(1);
  });

const db = mongoose.connection;

// ============ AUTHENTICATION ROUTES ============

// Check if admin exists
app.get('/api/auth/check-admin', async (req, res) => {
  try {
    const admin = await db.collection('users').findOne({ role: 'admin' });
    res.json({ adminExists: !!admin });
  } catch (err) {
    console.error('Error checking admin:', err);
    res.status(500).json({ success: false, msg: 'Error checking admin' });
  }
});

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, profilePicture, role } = req.body;

    console.log('Registration attempt:', { username, email, role });

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Username, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Email already registered' 
      });
    }

    // Check if admin already exists (only one admin allowed)
    if (role === 'admin') {
      const existingAdmin = await db.collection('users').findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ 
          success: false, 
          msg: 'Admin already exists. Only one admin allowed.' 
        });
      }
    }

    // Hash password (basic - use bcrypt in production)
    const hashedPassword = Buffer.from(password).toString('base64');

    // Create user object
    const newUser = {
      username,
      email,
      password: hashedPassword,
      profilePicture: profilePicture || null,
      role: role || 'user',
      online: false,
      createdAt: new Date()
    };

    // Insert into database
    const result = await db.collection('users').insertOne(newUser);

    // Generate simple JWT token (use jsonwebtoken in production)
    const token = Buffer.from(JSON.stringify({ 
      id: result.insertedId, 
      email,
      role 
    })).toString('base64');

    console.log('✓ User registered successfully:', email);

    res.json({
      success: true,
      token,
      user: {
        id: result.insertedId,
        username,
        email,
        profilePicture: profilePicture || null,
        role
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Registration error: ' + err.message 
    });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Email and password are required' 
      });
    }

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        msg: 'User not found' 
      });
    }

    // Verify password
    const hashedPassword = Buffer.from(password).toString('base64');
    if (user.password !== hashedPassword) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Invalid password' 
      });
    }

    // Generate token
    const token = Buffer.from(JSON.stringify({ 
      id: user._id, 
      email,
      role: user.role 
    })).toString('base64');

    console.log('✓ User logged in successfully:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Login error: ' + err.message 
    });
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    msg: '✓ Backend is running and connected to MongoDB Atlas!' 
  });
});

app.get('/api/auth/test', (req, res) => {
  res.json({ success: true, msg: 'Auth routes working' });
});

// ============ SOCKET.IO ============
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('✓ New client connected');
  socket.emit('message', 'Welcome to YPA Chat!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});