const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');

// MongoDB Connection URL
const mongoURL = 'mongodb+srv://saurabhdangi03:o8EQDzFhV0u5Zx1K@cluster0.fvnbp.mongodb.net/chat?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Define the Message Schema and Model
const MessageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    seen: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// Initialize Express app and server
const app = express();
app.use(cors({
    origin: 'https://chat-front-rosy.vercel.app', // Allow your frontend URL
    methods: ["GET", "POST"]
}));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'https://chat-front-rosy.vercel.app', // Allow your frontend URL
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

let onlineUsers = {}; // To track online users

// When a client connects to the Socket.io server
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle when a user joins a room (chat between 2 users)
    socket.on('joinRoom', ({ sender, receiver }) => {
        const roomId = [sender, receiver].sort().join('_'); // Create a room based on users
        socket.join(roomId);
        onlineUsers[sender] = socket.id;
        console.log(`${sender} joined room: ${roomId}`);

        // Send previous messages to both users when they join the room
        Message.find({
            $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ timestamp: 1 }).then(messages => {
            socket.emit('loadMessages', messages);
        });

        // Notify about online status
        socket.broadcast.emit('userOnline', { sender });
    });

    // Handle message sending between two users
    socket.on('sendMessage', ({ sender, receiver, message }) => {
        const roomId = [sender, receiver].sort().join('_');
        const newMessage = new Message({ sender, receiver, message });

        newMessage.save().then(() => {
            io.to(roomId).emit('receiveMessage', newMessage); // Broadcast to both users
        });
    });

    // Handle typing event
    socket.on('typing', ({ sender, receiver }) => {
        const roomId = [sender, receiver].sort().join('_');
        socket.to(roomId).emit('userTyping', { sender });
    });

    // Mark message as seen
    socket.on('markAsSeen', ({ sender, receiver }) => {
        const roomId = [sender, receiver].sort().join('_');
        Message.updateMany({ sender: receiver, receiver: sender, seen: false }, { seen: true }).then(() => {
            io.to(roomId).emit('messageSeen', { sender });
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        let userId;
        for (let user in onlineUsers) {
            if (onlineUsers[user] === socket.id) {
                userId = user;
                break;
            }
        }
        delete onlineUsers[userId];
        socket.broadcast.emit('userOffline', { sender: userId });
        console.log('Client disconnected:', socket.id);
    });
});

// API to get all messages (for testing purposes)
app.get('/api/messages', (req, res) => {
    Message.find().then(messages => res.json({ messages }));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
