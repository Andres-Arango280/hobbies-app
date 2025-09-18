const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  caption: { type: String, required: true },
  media: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ← así se llama
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', postSchema);
