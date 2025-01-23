const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const PORT = process.env.PORT || 3000;
const URL = process.env.DATABASE_URL;

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Función para generar un ID aleatorio
function generateRandomId(length) {
    const characters = 'CONVENTUS1234567890';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function connectToDatabase() {
    try {
        const client = await MongoClient.connect(URL);
        console.log('Conectado exitosamente a MongoDB');

        const dbName = client.db().databaseName;
        const db = client.db(dbName);

        // Ruta para crear una reunión
        app.post('/create-meeting', async (req, res) => {
            const { title, description } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'Necesitas un título para tu reunión' });
            }

            const meetingId = generateRandomId(6);
            const newMeeting = {
                title,
                id: meetingId,
                description,
                proposals: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                await db.collection('meetings').insertOne(newMeeting);
                res.status(201).json({ message: 'Reunión creada', meetingId });
            } catch (error) {
                console.error("Error al crear la reunión:", error);
                res.status(500).json({ error: 'Error al crear la reunión' });
            }
        });

        // Ruta principal
        app.get('/', (req, res) => {
            res.render('index');
        });

        // Ruta para mostrar detalles de una reunión
        app.get('/meetings/:id', async (req, res) => {
            const { id } = req.params;

            try {
                console.log(`Buscando reunión con ID: ${id}`);
                const meeting = await db.collection('meetings').findOne({ id });

                if (!meeting) {
                    return res.status(404).send('<h1>Reunión no encontrada</h1>');
                }

                // Asegúrate de que meeting.proposals sea un arreglo
                if (!Array.isArray(meeting.proposals)) {
                    meeting.proposals = [];
                }

                // Renderizar la vista con los detalles de la reunión
                return res.render('meetings', { meeting });
            } catch (error) {
                console.error("Error al obtener la reunión:", error);
                return res.status(500).send('<h1>Error al obtener la reunión</h1>');
            }
        });

        // Ruta para eliminar una reunión
        app.delete('/meetings/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const result = await db.collection('meetings').deleteOne({ id });

                if (result.deletedCount === 0) {
                    return res.status(404).send('<h1>Reunión no encontrada</h1>');
                }

                // Redirigir al usuario después de eliminar
                return res.redirect('/'); // Cambia esto si quieres redirigir a otra página
            } catch (error) {
                console.error("Error al eliminar la reunión:", error);
                return res.status(500).send('<h1>Error al eliminar la reunión</h1>');
            }
        });

        // Iniciar el servidor después de conectarse a MongoDB
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
    }
}

// Llamar a la función para conectar a la base de datos
connectToDatabase();