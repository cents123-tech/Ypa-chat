import React, { useState, useEffect, useRef } from 'react';

const SOCKET_URL = 'http://localhost:5000';

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
  const [notifications, setNotifications] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.log('❌ No socket');
      return;
    }

    console.log(`👨‍💼 Admin Dashboard mounted for ${user.username}`);

    // Load initial messages
    socket.on('load_messages', (loadedMessages) => {
      console.log(`📥 Admin: Received ${loadedMessages.length} messages`);
      console.log('📊 Messages:', loadedMessages);
      setMessages(loadedMessages);
    });

    // Listen for new messages
    socket.on('receive_message', (message) => {
      console.log(`📨 Admin: New message received`, message);
      setMessages(prev => {
        const updated = [...prev, message];
        console.log(`📊 Total messages now: ${updated.length}`);
        return updated;
      });
    });

    // Listen for user status
    socket.on('user_status_update', (data) => {
      console.log('🔄 User status:', data);
      setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, online: data.online } : u
      ));
    });

    // Listen for users list
    socket.on('load_users', (loadedUsers) => {
      console.log(`👥 Admin: Received ${loadedUsers.length} users`);
      const nonAdminUsers = loadedUsers.filter(u => u.role === 'user');
      setUsers(nonAdminUsers);
    });

    // 🔔 LISTEN FOR LOGIN NOTIFICATIONS
    socket.on('user_login_notification', (notification) => {
      console.log('🔔 LOGIN NOTIFICATION:', notification);
      setNotifications(prev => [notification, ...prev]);
      // Auto remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.userId !== notification.userId));
      }, 5000);
    });

    return () => {
      socket.off('load_messages');
      socket.off('receive_message');
      socket.off('user_status_update');
      socket.off('load_users');
      socket.off('user_login_notification');
    };
  }, [socket, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages for selected user
  const filteredMessages = selectedUser
    ? messages.filter(msg => {
        const isFromSelectedUserToAdmin = msg.senderId === selectedUser.id && msg.recipientId === user.id;
        const isFromAdminToSelectedUser = msg.senderId === user.id && msg.recipientId === selectedUser.id;
        return isFromSelectedUserToAdmin || isFromAdminToSelectedUser;
      })
    : [];

  console.log(`🔍 Filtered ${filteredMessages.length} messages for selected user ${selectedUser?.id}`);

  const sendMessage = () => {
    if (!newMessage.trim() && !mediaFile) {
      console.log('⚠️ Empty message');
      return;
    }

    if (!selectedUser) {
      alert('⚠️ Select a user first');
      return;
    }

    if (!socket) {
      alert('❌ Not connected');
      return;
    }

    console.log(`📤 Admin sending message to ${selectedUser.username}:`, {
      text: newMessage,
      sender: user.id,
      recipientId: selectedUser.id,
      senderRole: 'admin'
    });

    socket.emit('send_message', {
      text: newMessage,
      media: mediaFile,
      recipientId: selectedUser.id,
      sender: user.id,
      senderRole: 'admin'
    });

    setNewMessage('');
    setMediaFile(null);
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure?')) {
      setUsers(users.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      socket?.emit('delete_user', userId);
      alert('✓ User deleted');
    }
  };

  const addNewUser = async () => {
    if (!newUserForm.username.trim() || !newUserForm.email.trim()) {
      alert('✗ Fill all fields');
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
        alert('✓ User added');
      } else {
        alert('✗ ' + data.msg);
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
              <h3>Users ({users.length})</h3>
              <div className="user-stats">
                <span>🟢 Online: {users.filter(u => u.online).length}</span>
                <span>⚫ Offline: {users.filter(u => !u.online).length}</span>
              </div>

              {users.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '20px' }}>No users</p>
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
                    {filteredMessages.length === 0 ? (
                      <div className="empty-state">No messages</div>
                    ) : (
                      filteredMessages.map((msg, idx) => {
                        const isAdminMessage = msg.senderId === user.id;
                        return (
                          <div key={`${msg.id}-${idx}`} className={`message-row ${isAdminMessage ? 'admin-msg' : 'user-msg'}`}>
                            <div className="message-bubble">
                              {msg.text && <p>{msg.text}</p>}
                              {msg.media && (
                                <div className="media-display">
                                  [{msg.media.type?.split('/')[0].toUpperCase() || 'FILE'}]
                                </div>
                              )}
                              <span className="timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
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
                <div className="empty-state large">Select a user to chat</div>
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
                <option value="user">User (123)</option>
                <option value="admin">Admin (12345)</option>
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
              <label>Company</label>
              <p className="setting-value">YPA Enterprise</p>
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

export default AdminDashboard;