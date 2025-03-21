const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, '..', 'styles')));
app.use(express.static(path.join(__dirname, '..')));

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

        // Middleware para registrar visitas
        app.use(async (req, res, next) => {
            const ip = req.ip;
            const userAgent = req.get('User-Agent');

            // Guardar la visita en la colección "visitas"
            await db.collection('visitas').insertOne({
                fecha: new Date(),
                ip,
                userAgent,
            });

            next();
        });

        // Ruta para ver estadísticas
        app.get('/admin/estadisticas', async (req, res) => {
            try {
                // Contar el total de visitas
                const totalVisitas = await db.collection('visitas').countDocuments();

                // Contar dispositivos únicos (basados en IP y userAgent)
                const dispositivosUnicos = await db.collection('visitas').aggregate([
                    {
                        $group: {
                            _id: { ip: '$ip', userAgent: '$userAgent' },
                        },
                    },
                    {
                        $count: 'dispositivosUnicos',
                    },
                ]).toArray();

                res.json({
                    totalVisitas,
                    dispositivosUnicos: dispositivosUnicos[0]?.dispositivosUnicos || 0,
                });
            } catch (error) {
                console.error("Error al obtener estadísticas:", error);
                res.status(500).json({ error: 'Error al obtener estadísticas' });
            }
        });

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

                if (!Array.isArray(meeting.proposals)) {
                    meeting.proposals = [];
                }

                const availabilityMap = {};
                const userCount = meeting.proposals.length;

                // Construir availabilityMap
                meeting.proposals.forEach(proposal => {
                    if (!Array.isArray(proposal.availability)) return;

                    proposal.availability.forEach(time => {
                        if (!availabilityMap[time]) {
                            availabilityMap[time] = new Set();
                        }
                        availabilityMap[time].add(proposal.username);
                    });
                });

                // Calcular commonAvailability y otherAvailability
                const commonAvailability = Object.entries(availabilityMap)
                    .filter(([time, users]) => users.size === userCount);

                const otherAvailability = Object.entries(availabilityMap)
                    .filter(([time, users]) => users.size > 1);

                // Renderizar la vista con los detalles de la reunión
                return res.render('meetings', { 
                    meeting, 
                    commonAvailability,  // Pasar commonAvailability a la vista
                    otherAvailability     // Pasar otherAvailability a la vista
                });
            } catch (error) {
                console.error("Error al obtener la reunión:", error);
                return res.status(500).send('<h1>Error al obtener la reunión</h1>');
            }
        });

        app.post('/meetings/:id', async (req, res) => {
            const { id } = req.params;
            const { username, availability } = req.body;
        
            if (!username || !availability || availability.length === 0) {
                return res.status(400).json({ error: 'Faltan datos requeridos.' });
            }
        
            const availabilityEntry = {
                username,
                availability,
                createdAt: new Date(),
            };
        
            try {
                // Actualizar la reunión agregando la nueva propuesta al array proposals
                await db.collection('meetings').updateOne(
                    { id }, // Buscar por ID
                    { $push: { proposals: availabilityEntry } } // Añadir al array proposals
                );
        
                return res.status(200).json({ message: 'Disponibilidad añadida exitosamente.' });
            } catch (error) {
                console.error("Error al añadir disponibilidad:", error);
                return res.status(500).json({ error: 'Error al añadir disponibilidad.' });
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