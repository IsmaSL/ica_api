import express from "express";
import { pool } from "./database.js";
import { PORT } from "./config.js";

// Inicializa express
const app = express()

app.get('/', (req, res) => {
    res.send('Welcome to my Sever');
})

app.get('/ping', async (req, res) => {
    const [result] = await pool.query(`SELECT "Hello world" as RESULT`);
    res.json(result[0]);
    console.log(result[0]);
})

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