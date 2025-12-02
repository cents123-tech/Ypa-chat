// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Registration from './Registration';
import Login from './Login';
import './App.css';

const SOCKET_URL = 'http://localhost:5000';

// ============ USER DASHBOARD ============
const UserDashboard = ({ user, socket, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('load_messages', (loadedMessages) => {
      setMessages(loadedMessages);
    });

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('load_messages');
      socket.off('receive_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if ((newMessage.trim() || mediaFile) && socket) {
      socket.emit('send_message', {
        text: newMessage,
        media: mediaFile,
        recipientId: 'admin1',
        sender: user.id,
        senderRole: 'user'
      });
      setNewMessage('');
      setMediaFile(null);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFile({
          type: file.type,
          data: reader.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="dashboard-container user-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="avatar-large">{user.username?.charAt(0).toUpperCase()}</div>
          <div className="header-info">
            <h2>{user.username}</h2>
            <p>YPA User</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-logout">Logout</button>
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <h3>💬 Chat with Admin</h3>
          <p className="status">Real-time communication</p>
        </div>

        <div className="messages-box">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>👋 Start a conversation with admin</p>
            </div>
          ) : (
            messages
              .filter(m => (m.senderId === user.id && m.recipientId === 'admin1') || (m.senderId === 'admin1' && m.recipientId === user.id))
              .map((msg, idx) => (
                <div key={idx} className={`message-row ${msg.senderId === user.id ? 'user-msg' : 'admin-msg'}`}>
                  <div className="message-bubble">
                    {msg.text && <p>{msg.text}</p>}
                    {msg.media && <div className="media-display">[{msg.media.type.split('/')[0].toUpperCase()}]</div>}
                    <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-section">
          {mediaFile && (
            <div className="media-preview">
              <span>{mediaFile.name}</span>
              <button onClick={() => setMediaFile(null)} type="button">✕</button>
            </div>
          )}
          <div className="input-row">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type message..."
              className="chat-input"
            />
            <label className="media-btn">
              📎
              <input type="file" onChange={handleMediaUpload} hidden />
            </label>
            <button onClick={sendMessage} className="btn btn-send">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ ADMIN DASHBOARD ============
const AdminDashboard = ({ user, socket, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [darkMode, setDarkMode] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: '', email: '', role: 'user' });
  const [addLoading, setAddLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('load_messages', (loadedMessages) => {
      setMessages(loadedMessages);
    });

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user_status_update', (data) => {
      setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, online: data.online } : u
      ));
    });

    socket.on('load_users', (loadedUsers) => {
      const nonAdminUsers = loadedUsers.filter(u => u.role === 'user');
      setUsers(nonAdminUsers);
    });

    return () => {
      socket.off('load_messages');
      socket.off('receive_message');
      socket.off('user_status_update');
      socket.off('load_users');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if ((newMessage.trim() || mediaFile) && selectedUser && socket) {
      socket.emit('send_message', {
        text: newMessage,
        media: mediaFile,
        recipientId: selectedUser.id,
        sender: user.id,
        senderRole: 'admin'
      });
      setNewMessage('');
      setMediaFile(null);
    }
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      socket?.emit('delete_user', userId);
      alert('✓ User deleted successfully');
    }
  };

  const addNewUser = async () => {
    if (!newUserForm.username.trim() || !newUserForm.email.trim()) {
      alert('✗ Please fill all fields');
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch(`${SOCKET_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserForm,
          password: newUserForm.role === 'admin' ? '12345' : '123'
        })
      });

      const data = await res.json();

      if (data.success) {
        setUsers([...users, data.user]);
        setNewUserForm({ username: '', email: '', role: 'user' });
        alert('✓ User added successfully');
      } else {
        alert('✗ ' + (data.msg || 'Error adding user'));
      }
    } catch (err) {
      alert('✗ Error: ' + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFile({
          type: file.type,
          data: reader.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-admin">YPA</div>
          <h3>Admin Panel</h3>
          <p>{user.username}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveTab('users')}
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('add-user')}
            className={`nav-btn ${activeTab === 'add-user' ? 'active' : ''}`}
          >
            ➕ Add User
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            ⚙️ Settings
          </button>
        </nav>

        <button onClick={onLogout} className="btn btn-logout sidebar-logout">Logout</button>
      </div>

      <div className="admin-main">
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="users-list">
              <h3>Connected Users ({users.length})</h3>
              <div className="user-stats">
                <span>🟢 Online: {users.filter(u => u.online).length}</span>
                <span>⚫ Offline: {users.filter(u => !u.online).length}</span>
              </div>

              {users.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '20px' }}>No users yet</p>
              ) : (
                users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`user-card ${selectedUser?.id === u.id ? 'selected' : ''}`}
                  >
                    <img
                      src={u.profilePicture || `https://via.placeholder.com/50?text=${u.username.charAt(0)}`}
                      alt={u.username}
                      className="user-pic"
                    />
                    <div className="user-card-info">
                      <p className="username">{u.username}</p>
                      <p className="user-status">{u.online ? '🟢 Online' : '⚫ Offline'}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteUser(u.id); }}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="admin-chat-area">
              {selectedUser ? (
                <>
                  <div className="chat-header-admin">
                    <img
                      src={selectedUser.profilePicture || `https://via.placeholder.com/50?text=${selectedUser.username.charAt(0)}`}
                      alt={selectedUser.username}
                      className="chat-user-pic"
                    />
                    <div>
                      <h3>{selectedUser.username}</h3>
                      <p>{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="messages-box">
                    {messages.filter(m => (m.senderId === selectedUser.id && m.recipientId === user.id) || (m.senderId === user.id && m.recipientId === selectedUser.id)).length === 0 ? (
                      <div className="empty-state">No messages with this user</div>
                    ) : (
                      messages
                        .filter(m => (m.senderId === selectedUser.id && m.recipientId === user.id) || (m.senderId === user.id && m.recipientId === selectedUser.id))
                        .map((msg, idx) => (
                          <div key={idx} className={`message-row ${msg.senderId === user.id ? 'admin-msg' : 'user-msg'}`}>
                            <div className="message-bubble">
                              {msg.text && <p>{msg.text}</p>}
                              {msg.media && <div className="media-display">[{msg.media.type.split('/')[0].toUpperCase()}]</div>}
                              <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="input-section">
                    {mediaFile && (
                      <div className="media-preview">
                        <span>{mediaFile.name}</span>
                        <button onClick={() => setMediaFile(null)} type="button">✕</button>
                      </div>
                    )}
                    <div className="input-row">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type response..."
                        className="chat-input"
                      />
                      <label className="media-btn">
                        📎
                        <input type="file" onChange={handleMediaUpload} hidden />
                      </label>
                      <button onClick={sendMessage} className="btn btn-send">Send</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state large">Select a user to start chatting</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'add-user' && (
          <div className="add-user-section">
            <h3>Add New User</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                className="input"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="input"
              />
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                className="input"
              >
                <option value="user">User (pwd: 123)</option>
                <option value="admin">Admin (pwd: 12345)</option>
              </select>
              <button onClick={addNewUser} className="btn btn-add-user" disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h3>Settings</h3>
            <div className="setting-item">
              <label>Dark Mode</label>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>Company Name</label>
              <p className="setting-value">YPA Enterprise</p>
            </div>
            <div className="setting-item">
              <label>Business</label>
              <p className="setting-value">Agricultural Import/Export & Farming</p>
            </div>
            <div className="setting-item">
              <label>Total Users</label>
              <p className="setting-value">{users.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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