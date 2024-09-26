import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; // Importing io from socket.io-client
import './App.css';

// Use the correct backend URL for your deployed application
const socket = io('https://chat-back-ivory.vercel.app', {
    transports: ['websocket', 'polling'], // Specify transports to avoid CORS issues
    withCredentials: true, // Allow credentials if needed
});

function App() {
    const [sender, setSender] = useState('');
    const [receiver, setReceiver] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [typing, setTyping] = useState(false);
    const [online, setOnline] = useState(false);
    const [seenMessages, setSeenMessages] = useState([]);
    const [isRoomJoined, setIsRoomJoined] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Socket event listeners
        socket.on('loadMessages', (msgs) => {
            setMessages(msgs);
        });

        socket.on('receiveMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('userTyping', ({ sender }) => {
            setTyping(true);
            setTimeout(() => setTyping(false), 2000);
        });

        socket.on('messageSeen', ({ sender }) => {
            setSeenMessages((prev) => [...prev, sender]);
        });

        socket.on('userOnline', () => setOnline(true));
        socket.on('userOffline', () => setOnline(false));

        // Cleanup function to remove listeners on unmount
        return () => {
            socket.off('loadMessages');
            socket.off('receiveMessage');
            socket.off('userTyping');
            socket.off('messageSeen');
            socket.off('userOnline');
            socket.off('userOffline');
        };
    }, []);

    const handleJoinRoom = () => {
        if (sender && receiver) {
            socket.emit('joinRoom', { sender, receiver });
            setIsRoomJoined(true);
        }
    };

    const handleSendMessage = () => {
        if (message.trim() && sender && receiver) {
            socket.emit('sendMessage', { sender, receiver, message });
            setMessage(''); // Clear input after sending
        }
    };

    const handleTyping = () => {
        if (sender && receiver) {
            socket.emit('typing', { sender, receiver });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="chat-container">
            {!isRoomJoined ? (
                <div className="room-selection">
                    <h1>Start Chat</h1>
                    <input
                        type="text"
                        placeholder="Your Nickname"
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Receiver's Nickname"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                    />
                    <button onClick={handleJoinRoom}>Join Chat</button>
                </div>
            ) : (
                <div className="chat-room">
                    <h2>Chat between {sender} and {receiver}</h2>
                    <p>{online ? `${receiver} is online` : `${receiver} is offline`}</p>
                    <div className="chat-box">
                        <ul>
                            {messages.map((msg, index) => (
                                <li key={index} className={msg.sender === sender ? 'sent' : 'received'}>
                                    <strong>{msg.sender}:</strong> {msg.message}
                                    <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    {msg.seen && <span className="seen-status">✓</span>}
                                </li>
                            ))}
                            {typing && <li className="typing">The other user is typing...</li>}
                            <div ref={messagesEndRef} />
                        </ul>
                    </div>
                    <div className="message-input">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyUp={handleTyping}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
