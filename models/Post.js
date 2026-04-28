const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  caption: { type: String, required: true },
  media: { type: String },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  likes: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  comentarios: [
    {
      texto: String,
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fecha: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
