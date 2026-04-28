const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    default: ''
  },
  date: { 
    type: String, // Formato: YYYY-MM-DD
    required: true 
  },
  time: { 
    type: String, // Formato: HH:MM
    default: '00:00'
  },
  place: { 
    type: String,
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  // Campos adicionales para interés y asistencia
  interesados: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  asistentes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Event', eventSchema);