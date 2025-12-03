import React, { useState, useEffect, useRef } from 'react';

const UserDashboard = ({ user, socket, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.log('❌ No socket');
      return;
    }

    console.log(`👤 User Dashboard mounted for ${user.username}`);

    // Load initial messages
    socket.on('load_messages', (loadedMessages) => {
      console.log(`📥 User: Received ${loadedMessages.length} messages`);
      console.log('📊 Messages:', loadedMessages);
      setMessages(loadedMessages);
    });

    // Listen for new messages
    socket.on('receive_message', (message) => {
      console.log(`📨 User: New message received`, message);
      setMessages(prev => {
        const updated = [...prev, message];
        console.log(`📊 Total messages now: ${updated.length}`);
        return updated;
      });
    });

    return () => {
      socket.off('load_messages');
      socket.off('receive_message');
    };
  }, [socket, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages: only show conversation between this user and admin
  const filteredMessages = messages.filter(msg => {
    const isFromUserToAdmin = msg.senderId === user.id && msg.recipientId === 'admin1';
    const isFromAdminToUser = msg.senderId === 'admin1' && msg.recipientId === user.id;
    return isFromUserToAdmin || isFromAdminToUser;
  });

  console.log(`🔍 Filtered ${filteredMessages.length} messages for user ${user.id}`);

  const sendMessage = () => {
    if (!newMessage.trim() && !mediaFile) {
      console.log('⚠️ Empty message');
      return;
    }

    if (!socket) {
      alert('❌ Not connected');
      return;
    }

    console.log(`📤 User sending message:`, {
      text: newMessage,
      sender: user.id,
      recipientId: 'admin1',
      senderRole: 'user'
    });

    socket.emit('send_message', {
      text: newMessage,
      media: mediaFile,
      recipientId: 'admin1',
      sender: user.id,
      senderRole: 'user'
    });

    setNewMessage('');
    setMediaFile(null);
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
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              <p>👋 Start a conversation with admin</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isUserMessage = msg.senderId === user.id;
              return (
                <div key={`${msg.id}-${idx}`} className={`message-row ${isUserMessage ? 'user-msg' : 'admin-msg'}`}>
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

export default UserDashboard;