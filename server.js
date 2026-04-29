const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
// MODELOS
// ----------------------
const User = require('./models/User');
const Post = require('./models/Post');
const Event = require('./models/Event');


// ----------------------
// CONEXIÓN MONGO
// ----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error al conectar con MongoDB:", err));

// ----------------------
// MIDDLEWARES
// ----------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ----------------------
// ARCHIVOS ESTÁTICOS
// ----------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ----------------------
// CONFIGURAR MULTER
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// ----------------------
// 🔐 FUNCIÓN AUXILIAR PARA OBTENER USERID
// ----------------------
async function getUserIdFromRequest(req) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
      return decoded.userId;
    } catch {
      return null;
    }
  }
  if (req.session.userId) return req.session.userId;
  return null;
}

// ----------------------
// MIDDLEWARES DE AUTENTICACIÓN
// ----------------------
function ensureAuth(req, res, next) {
  if (req.session.userId) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No hay token, autorización denegada' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error en autenticación:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    res.status(500).json({ error: 'Error en la autenticación' });
  }
};

// ----------------------
// AUTH ROUTES
// ----------------------
// ----------------------
// RUTAS DE AUTENTICACIÓN
// ----------------------

// 🔹 Registro
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Faltan datos' });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: 'Usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      username: username.trim(),
      password: hashedPassword,
      email: `${username.trim()}@temp.com`
    });

    await user.save();
    req.session.userId = user._id;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: { _id: user._id, username: user.username }
    });
  } catch (err) {
    console.error('🚨 Error en /api/register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🔹 Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🟢 Datos recibidos en login:', req.body);

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });

    req.session.userId = user._id;

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      user: { _id: user._id, username: user.username },
      token
    });
  } catch (err) {
    console.error('❌ Error en login:', err);
    res.status(500).json({ error: 'Error en login', details: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logout exitoso' }));
});

// ----------------------
// PERFIL
// ----------------------
app.get('/api/perfil', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil', details: err.message });
  }
});

app.post('/api/perfil/update', ensureAuth, upload.single('fotoPerfil'), async (req, res) => {
  try {
    const { username, descripcion, deporteFavorito, ubicacion, hobbies } = req.body;

    const updateData = {};
    
    if (username) updateData.username = username.trim();
    if (descripcion) updateData.descripcion = descripcion.trim();
    if (deporteFavorito) updateData.deporteFavorito = deporteFavorito.trim();
    if (ubicacion) updateData.ubicacion = ubicacion.trim();
    if (hobbies) updateData.hobbies = hobbies.split(',').map(h => h.trim()).filter(h => h);

    if (req.file) {
      updateData.fotoPerfil = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.session.userId, 
      updateData, 
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    res.json({ message: 'Perfil actualizado correctamente', user });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil', details: err.message });
  }
});


// ----------------------
// PUBLICACIONES
// ----------------------
app.post('/api/posts', ensureAuth, upload.single('media'), async (req, res) => {
  try {
    const { caption } = req.body;
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;

    const post = new Post({
      caption,
      media: mediaPath,
      createdBy: req.session.userId
    });

    await post.save();
    await post.populate('createdBy', 'username fotoPerfil');
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear publicación', details: err.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('createdBy', 'username fotoPerfil')
      .populate('comentarios.usuario', 'username fotoPerfil')
      .populate('likes', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error('❌ Error al obtener posts:', err);
    res.status(500).json({ error: 'Error al obtener publicaciones', details: err.message });
  }
});

// ----------------------
// LIKES Y COMENTARIOS (sistema híbrido)
// ----------------------
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ 
      message: 'Reacción actualizada', 
      likesCount: post.likes.length, 
      liked: index === -1 
    });
  } catch (err) {
    console.error('❌ Error al reaccionar:', err);
    res.status(500).json({ error: 'Error al reaccionar', details: err.message });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ error: 'Comentario vacío' });

    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });

    post.comentarios.push({ texto, usuario: userId });
    await post.save();

    await post.populate('comentarios.usuario', 'username fotoPerfil');

    res.json({ 
      message: 'Comentario agregado', 
      comentarios: post.comentarios
    });
  } catch (err) {
    console.error('❌ Error al comentar:', err);
    res.status(500).json({ error: 'Error al comentar', details: err.message });
  }
});

// ----------------------
// EVENTOS
// ----------------------
app.post('/api/events', ensureAuth, async (req, res) => {
  try {
    const { title, description, date, time, place } = req.body;

    if (!title || !date || !time || !place)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });

    const event = new Event({
      title: title.trim(),
      description: description ? description.trim() : '',
      date,
      time,
      place: place.trim(),
      createdBy: req.session.userId
    });

    await event.save();
    await event.populate('createdBy', 'username fotoPerfil');
    
    res.json(event);
  } catch (err) {
    console.error('❌ Error al crear evento:', err);
    res.status(500).json({ error: 'Error al crear evento', details: err.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'username fotoPerfil')
      .populate('interesados', 'username')
      .populate('asistentes', 'username')
      .sort({ date: 1, time: 1 });

    res.json(events);
  } catch (err) {
    console.error('❌ Error al obtener eventos:', err);
    res.status(500).json({ error: 'Error al obtener eventos', details: err.message });
  }
});

app.post('/api/events/:id/interesado', ensureAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    const userId = req.session.userId;
    const index = event.interesados.indexOf(userId);

    if (index === -1) {
      event.interesados.push(userId);
    } else {
      event.interesados.splice(index, 1);
    }

    await event.save();
    res.json({ 
      message: 'Interés actualizado', 
      interesados: event.interesados.length,
      interested: index === -1 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar interés', details: err.message });
  }
});

app.post('/api/events/:id/asistir', ensureAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    const userId = req.session.userId;
    const index = event.asistentes.indexOf(userId);

    if (index === -1) {
      event.asistentes.push(userId);
    } else {
      event.asistentes.splice(index, 1);
    }

    await event.save();
    res.json({ 
      message: 'Asistencia actualizada', 
      asistentes: event.asistentes.length,
      attending: index === -1 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al asistir', details: err.message });
  }
});

// ----------------------
// INICIAR SERVIDOR
// ----------------------
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));