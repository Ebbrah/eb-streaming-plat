const mongoose = require('mongoose');

const ViewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // null for guests
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  viewedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('View', ViewSchema); 