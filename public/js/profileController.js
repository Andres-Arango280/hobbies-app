const UserProfile = require("../models/UserProfile");
const jwt = require("jsonwebtoken");

// 🔹 Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token no proporcionado" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: "Perfil no encontrado" });

    res.json(profile);
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// 🔹 Crear o actualizar perfil
exports.saveProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token no proporcionado" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { username, descripcion, deporteFavorito, ubicacion, hobbies } = req.body;
    let fotoPerfil = "";

    if (req.file) fotoPerfil = `/uploads/${req.file.filename}`;

    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      profile.username = username;
      profile.descripcion = descripcion;
      profile.deporteFavorito = deporteFavorito;
      profile.ubicacion = ubicacion;
      profile.hobbies = hobbies ? hobbies.split(",") : [];
      if (fotoPerfil) profile.fotoPerfil = fotoPerfil;
      await profile.save();
    } else {
      profile = new UserProfile({
        userId,
        username,
        descripcion,
        deporteFavorito,
        ubicacion,
        hobbies: hobbies ? hobbies.split(",") : [],
        fotoPerfil,
      });
      await profile.save();
    }

    res.status(200).json({ message: "Perfil guardado con éxito", user: profile });
  } catch (error) {
    console.error("Error al guardar el perfil:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
