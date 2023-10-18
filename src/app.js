import express from "express";
import { pool } from "./database.js";
import { PORT } from "./config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Inicializa express
const app = express()

app.use(express.json()); // Para poder recibir datos JSON en el body

app.get('/', (req, res) => {
    res.send('Welcome to my Sever');
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'Faltan datos de usuario o contraseña' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE correo = ?', [username]);
    if (rows.length === 0) {
        return res.status(401).send({ error: 'Usuario no encontrado.' });
    }

    const user = rows[0];
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).send({ error: 'Usuario o contraseña incorrectos' });
    }

    // Aquí puedes usar JWT para generar un token y enviarlo al cliente si así lo prefieres.
    const token = jwt.sign({ userId: user.id }, 'batichico', { expiresIn: '1h' });

    res.send({ user, token });
});

app.get('/all-users', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM users;');
    res.json(rows);
})

app.get('/addUser', async (req, res) => {
    const result = await pool.query('INSERT INTO users (correo, contraseña, url_img, nombre, apellidos, telefono, rol) VALUES ()');
})

// Da un puerto
app.listen(PORT)
console.log('Server on port ', PORT)