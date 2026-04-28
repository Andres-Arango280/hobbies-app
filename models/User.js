const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "El nombre de usuario es obligatorio"],
    unique: true,
    trim: true,
    minlength: [3, "El nombre de usuario debe tener al menos 3 caracteres"]
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [4, "La contraseña debe tener al menos 4 caracteres"]
  },
  email: { type: String },
  descripcion: { type: String },
  deporteFavorito: { type: String },
  ubicacion: { type: String },
  hobbies: [String],
  fotoPerfil: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// 🔹 Comparar contraseñas (login)
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
