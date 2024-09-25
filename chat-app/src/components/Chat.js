// src/components/Chat.js
import React, { useEffect, useState } from 'react';
import Message from './Message';

const Chat = ({ socket, nickname }) => {
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [recipient, setRecipient] = useState('');

  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    fetchMessages(); // Fetch existing messages from the database
  }, [socket]);

  const fetchMessages = async () => {
    const response = await fetch('http://localhost:4000/api/messages');
    const data = await response.json();
    setMessages(data.messages);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const msgData = { to: recipient, message, room };
    socket.emit('sendMessage', msgData);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <div className="room-selection">
        <label>Room:</label>
        <select onChange={(e) => setRoom(e.target.value)} value={room}>
          <option value="">Select a room</option>
          <option value="general">General</option>
          <option value="tech">Tech</option>
          <option value="random">Random</option>
        </select>
      </div>

      <div className="recipient-selection">
        <label>Recipient:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient nickname"
          required
        />
      </div>

      <div className="messages">
        {messages.map((msg, index) => (
          <Message key={index} content={msg} />
        ))}
        {isTyping && <div className="typing-indicator">Someone is typing...</div>}
      </div>

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            socket.emit('typing', room);
          }}
          placeholder="Type a message..."
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
