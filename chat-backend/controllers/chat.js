// controllers/chat.js
const Message = require('../models/Message');

// Fetch all messages from MongoDB
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 });
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
};

// Save message to MongoDB
exports.saveMessage = async (room, msg) => {
    const message = new Message({
        room,
        user: msg.user,
        message: msg.message
    });
    try {
        await message.save();
        console.log('Message saved to MongoDB');
    } catch (error) {
        console.error('Error saving message:', error);
    }
};
