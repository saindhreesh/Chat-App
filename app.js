const express = require('express');
require('dotenv').config()
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`💬 server on port http://localhost:${PORT}`));
const mongoose = require('mongoose');

const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

let socketsConected = new Set();

// Database connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Import the Message model
const Message = require('./models/Message');

// Handle socket connections
io.on('connection', async (socket) => {
  socketsConected.add(socket.id);
  io.emit('clients-total', socketsConected.size); // emit the total client values 

  // Send chat history to the newly connected client
  try {
    const messages = await Message.find().sort({ dateTime: 1 }); // Sort by dateTime
    socket.emit('chat-history', messages);
  } catch (err) {
    console.error('Error retrieving messages:', err);
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
    socketsConected.delete(socket.id);
    io.emit('clients-total', socketsConected.size);
  });

  // Handle incoming messages
  socket.on('message', async (data) => {
    try {
      // Save the message to the database
      const message = new Message(data);
      await message.save();
      console.log('Message saved:', message);

      // Broadcast the message to other clients
      socket.broadcast.emit('chat-message', data);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // Handle typing feedback
  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });
});