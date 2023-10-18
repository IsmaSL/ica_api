import express from "express";
import { pool } from "./database.js";
import { PORT, PW_TOKEN, OG_CORS } from "./config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from 'cors';

// Inicializa express
const app = express()

// Configura CORS
const corsOptions = {
    origin: OG_CORS , // Cambia esto al dominio de tu frontend si es diferente
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Permite cookies
    optionsSuccessStatus: 204
  };
app.use(cors(corsOptions));

app.use(express.json()); // Para poder recibir datos JSON en el body

app.get('/', (req, res) => {
    res.send('Welcome to my Sever');
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'Faltan datos de usuario o contraseña' });
    }

    const [rows] = await pool.query('SELECT correo, url_img, nombre, apellidos, telefono, rol FROM users WHERE correo = ?', [username]);
    if (rows.length === 0) {
        return res.status(401).send({ error: 'Usuario no encontrado.' });
    }

    const user = rows[0];

    if (!password || !user.contraseña) {
        return res.status(401).send({ error: 'Contraseña incorrectos' });
    }
    
    const match = await bcrypt.compare(password, user.contraseña);
    if (!match) {
        return res.status(401).send({ error: 'Usuario o contraseña incorrectos' });
    }

    // Aquí puedes usar JWT para generar un token y enviarlo al cliente si así lo prefieres.
    const token = jwt.sign({ userId: user.correo }, PW_TOKEN, { expiresIn: '1h' });

    res.send({ user, token });
});

app.get('/all-users', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM users;');
    res.json(rows);
})

app.post('/add-user', async (req, res) => {
    const { email, password, url_img, name, last_name, phone, role } = req.body;

    if (!email || !password || !name || !last_name || !phone || !role) {
        return res.status(400).send({ error: 'Faltan datos para el registro.' });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        await pool.query(
            'INSERT INTO users (correo, contraseña, url_img, nombre, apellidos, telefono, rol) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [email, hashedPassword, url_img, name, last_name, phone, role]
        );
        res.status(201).send({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar el usuario' });
    }
})

// Da un puerto
app.listen(PORT)
console.log('Server on port ', PORT)