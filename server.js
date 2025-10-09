const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Event = require('./models/Event');

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(()=> console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ MongoDB error', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 día
}));



// Static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirigir la raíz "/" al login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// Multer setup (para imágenes/videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_'))
});
const upload = multer({ storage });

// Auth helpers
function ensureAuth(req, res, next){
  if(req.session.userId) return next();
  return res.status(401).json({ error: 'no autorizado' });
}

//
// --- AUTH ROUTES ---
//

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Faltan datos" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Usuario ya existe" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    req.session.userId = user._id;
    res.json({ message: "Usuario registrado", user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar", details: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

    req.session.userId = user._id;
    res.json({ message: "Login exitoso", user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "Error en login", details: err.message });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logout exitoso" });
  });
});

// Perfil (protegido)
app.get('/api/perfil', ensureAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select("-password");
  res.json(user);
});

//
// --- EVENTS ROUTES ---
//

// Crear evento
app.post('/api/events', ensureAuth, async (req, res) => {
  try {
    console.log("📤 Creando evento:", req.body);
    console.log("👤 Usuario:", req.session.userId);
    
    const { title, description, date, time, place } = req.body;
    
    // Validación
    if (!title || !date || !time || !place) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const event = new Event({ 
      title: title.trim(), 
      description: description ? description.trim() : '', 
      date, 
      time, 
      place: place.trim(),
      createdBy: req.session.userId // ✅ Asignar el usuario que crea
    });
    
    await event.save();
    console.log("✅ Evento creado:", event);
    res.json(event);
  } catch (err) {
    console.error("❌ Error al crear evento:", err);
    res.status(500).json({ error: "Error al crear evento", details: err.message });
  }
});

// Listar eventos
app.get('/api/events', async (req, res) => {
  try {
    console.log("🔍 Obteniendo eventos...");
    
    const events = await Event.find()
      .populate("createdBy", "username") // ✅ Populate para obtener el username
      .sort({ date: 1, time: 1 }); // Ordenar por fecha y hora
    
    console.log(`📄 ${events.length} eventos encontrados`);
    res.json(events);
  } catch (err) {
    console.error("❌ Error al obtener eventos:", err);
    res.status(500).json({ error: "Error al obtener eventos", details: err.message });
  }
});
//
// --- POSTS ROUTES ---
//
// Crear publicación
app.post('/api/posts', ensureAuth, upload.single("media"), async (req, res) => {
  try {
    const { caption } = req.body;
    const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;

    const post = new Post({
      caption,
      media: mediaPath,
      createdBy: req.session.userId // ✅ DEBE ser createdBy
    });

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("❌ Error creando post:", err); // Mejor logging
    res.status(500).json({ error: "Error al crear publicación", details: err.message });
  }
});

// Listar publicaciones
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "username") // ✅ DEBE ser createdBy, NO user
      .sort({ createdAt: -1 });

    console.log(`📄 ${posts.length} publicaciones encontradas`); // Para debug
    res.json(posts);
  } catch (err) {
    console.error("❌ Error obteniendo posts:", err); // Mejor logging
    res.status(500).json({ error: "Error al obtener publicaciones", details: err.message });
  }
});

//
// --- START SERVER ---
//
app.listen(PORT, () => console.log(`🚀 Server en puerto ${PORT}`));
