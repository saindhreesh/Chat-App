const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  dateTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);