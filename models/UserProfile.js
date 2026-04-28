const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // referencia al usuario que ya tengas autenticado
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
    default: "",
  },
  deporteFavorito: {
    type: String,
    trim: true,
    default: "",
  },
  ubicacion: {
    type: String,
    trim: true,
    default: "",
  },
  fotoPerfil: {
    type: String, // URL de la imagen subida (ej. /uploads/usuario123.jpg)
    default: "",
  },
  hobbies: {
    type: [String], // lista de hobbies adicionales
    default: [],
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
