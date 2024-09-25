const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// MongoDB connection string from environment variables
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://saurabhdangi03:o8EQDzFhV0u5Zx1K@cluster0.fvnbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Use environment variable for deployment
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Message Schema
const messageSchema = new mongoose.Schema({
    room: String,
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Create server
const server = http.createServer();
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle nickname setting
    socket.on('setNickname', (nickname) => {
        socket.nickname = nickname;
    });

    // Join private chat room
    socket.on('joinPrivateChat', ({ user1, user2 }) => {
        const room = [user1, user2].sort().join('-'); // Consistent room name
        socket.join(room);
        socket.room = room;
        console.log(`${socket.nickname} joined private chat: ${room}`);
        
        // Load previous messages for the room
        Message.find({ room }).sort({ timestamp: 1 }).then(messages => {
            socket.emit('previousMessages', messages);
        });
    });

    // Join group chat
    socket.on('joinGroup', ({ groupName, nickname }) => {
        socket.join(groupName);
        socket.nickname = nickname;
        console.log(`${nickname} joined group ${groupName}`);
        io.to(groupName).emit('groupMessage', `${nickname} has joined the group!`);

        // Load previous group messages
        Message.find({ room: groupName }).sort({ timestamp: 1 }).then(messages => {
            socket.emit('previousMessages', messages);
        });
    });

    // Send messages
    socket.on('sendMessage', ({ room, message }) => {
        const msg = { sender: socket.nickname, message, timestamp: new Date() };

        // Save message to MongoDB
        const newMessage = new Message({ room, sender: socket.nickname, message });
        newMessage.save()
            .then(() => {
                io.to(room).emit('receiveMessage', msg);
            })
            .catch(err => console.error('Message saving error:', err));
    });

    // Typing indicator
    socket.on('typing', (room) => {
        socket.to(room).emit('typing', `${socket.nickname || 'Someone'} is typing...`);
    });

    socket.on('stopTyping', (room) => {
        socket.to(room).emit('stopTyping');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Export the server to be compatible with Vercel
module.exports = (req, res) => {
    if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Socket.IO server running');
    } else {
        server.emit('request', req, res);
    }
};

