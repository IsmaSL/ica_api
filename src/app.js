import express from "express";
import { pool } from "./database.js";
import { PORT, PW_TOKEN, OG_CORS } from "./config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from 'cors';

// Inicializa express
const app = express()

// Configura CORS
const whitelist = ['http://localhost:4200', 'https://ica-demo-app.netlify.app'];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
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

    const [rows] = await pool.query('SELECT * FROM users WHERE correo = ?', [username]);
    if (rows.length === 0) {
        return res.status(401).send({ error: 'Usuario no encontrado.' });
    }

    const user = rows[0];

    if (!password || !user.contraseña) {
        return res.status(401).send({ error: 'Contraseña incorrectos' });
    }

    if (user.status !== '1') {
        return res.status(401).send({ error: 'Tu cuenta ha sido suspendida.' });
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
    const currentUser = req.query.current_user; // Obtiene el correo del usuario actual de la URL   

    const [rows] = await pool.query('SELECT * FROM users;');
    const filteredRows = rows.filter(row => row.correo !== currentUser);
    res.json(filteredRows);
});

app.get('/all-requests', async (req, res) => {
    const [rows] = await pool.query(`SELECT * FROM requests WHERE status = '0' ORDER BY request_date ASC;`);
    res.json(rows);
});

app.patch('/update-request-status', async (req, res) => {
    const { email, newStatus } = req.body;

    if (!email || !newStatus) {
        return res.status(400).send({ error: 'Faltan datos para actualizar el estado de la solicitud.' });
    }

    try {
        await pool.query(
            'UPDATE requests SET status = ? WHERE email = ?',
            [newStatus, email]
        );
        res.status(200).send({ success: true, message: 'Estado de la solicitud actualizado con éxito' });
    } catch (error) {
        res.status(500).send({ success: false, error: 'Error al actualizar estado de la solicitud' });
    }
});

app.post('/add-user', async (req, res) => {
    const { email, password, url_img, name, last_name, phone, role } = req.body;

    if (!email || !password || !name || !last_name || !phone || !role) {
        return res.status(400).send({ error: 'Faltan datos para el registro.'});
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const status = 1;
        await pool.query(
            'INSERT INTO users (correo, contraseña, url_img, nombre, apellidos, telefono, rol, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, url_img, name, last_name, phone, role, status]
        );
        res.status(201).send({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar el usuario' });
    }
});

app.patch('/update-user-status', async (req, res) => {
    const { email, newStatus } = req.body;

    if (!email || newStatus === undefined) {
        return res.status(400).send({ error: 'Faltan datos para actualizar el estado del usuario.' });
    }

    try {
        await pool.query(
            'UPDATE users SET status = ? WHERE correo = ?',
            [newStatus, email]
        );
        res.status(200).send({ message: 'Estado del usuario actualizado con éxito' });
    } catch (error) {
        res.status(500).send({ error: 'Error al actualizar el estado del usuario' });
    }
});

app.post('/new-request', async (req, res) => {
    const { name, last_name, email } = req.body;

    if (!name || !last_name || !email) {
        return res.status(400).send({ error: 'Faltan datos para la solicitud' });
    }

    try {
        // Inserta la solicitud en la base de datos
        const [results] = await pool.query('INSERT INTO requests (name, last_name, email, request_date) VALUES (?, ?, ?, NOW())', [name, last_name, email]);

        // Envía una respuesta exitosa
        res.send({ success: true, requestId: results.insertId });
    } catch (error) {
        // Maneja el error y envía una respuesta de error
        console.error('Error procesando solicitud', error);
        res.status(500).send({ error: 'Error procesando solicitud' });
    }
});

// Da un puerto
app.listen(PORT)
console.log('Server on port ', PORT)