const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const URL = process.env.DATABASE_URL;

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// generar el ID aleatorio
function generateRandomId(length){
    const characters = 'CONVENTUS1234567890';
    let result = '';
    for (let i=0; i < length; i++){
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function connectToDatabase() {
    try {
        const client = await MongoClient.connect(URL); // Connect to MongoDB
        console.log('Conectado exitosamente a MongoDB');

        const dbName = client.db().databaseName; // Get database name
        const db = client.db(dbName); // Access the database

        // CREAR REUNIÓN
        app.post('/create-meeting', async (req, res) => {
            const { title, description } = req.body; // Get title and description from request body
            if (!title) {
                return res.status(400).json({ error: 'Necesitas un título para tu reunión' });
            }


            const meetingId = generateRandomId(6); // Generate a random

            const newMeeting = {
                title,
                id: meetingId,
                description, // Ensure description is included
                proposals: [], // Initially no proposals
                createdAt: new Date(), // Creation date
                updatedAt: new Date()  // Last updated date
            };

            try {
                await db.collection('meetings').insertOne(newMeeting); // Insert meeting into "meetings" collection
                res.status(201).json({ message: 'Reunión creada', meetingId }); // Respond with success and generated ID
            } catch (error) {
                console.error("Error al crear la reunión:", error);
                res.status(500).json({ error: 'Error al crear la reunión' });
            }
        });

        // Route to serve HTML file as main view
        app.get('/', (req, res) => {
            res.render('index'); // Ensure this file exists in your "public" folder
        });

        app.get('/meetings', (req, res) => {
            res.render('meetings'); // Ensure this file exists in your "public" folder
        });

        app.all('/meetings/:id', async (req, res) => {
            const { id } = req.params;
        
            if (req.method === 'GET') {
                // Mostrar los detalles de la reunión
                try {

                    console.log(`Buscando reunión con ID: ${id}`);
                    const meeting = await db.collection('meetings').findOne({ id });
                    if (!meeting) {
                        return res.status(404).send('<h1>Reunión no encontrada</h1>');
                    }
                    
                    const availabilityMap = {};
                    const userCount = meeting.proposals.length;

                    meeting.proposals.forEach(proposal => {
                        proposal.availability.forEach(time => {
                            if (!availabilityMap[time]){
                                availabilityMap[time] = new Set();
                            }
                            availabilityMap[time].add(proposal.username)

                        });
                    });

                    // Filtrar solo aquellas horas con más de un usuario
                    const commonAvailability = Object.entries(availabilityMap).filter(([time, users]) => users.size === userCount);
                    const otherAvailability = Object.entries(availabilityMap).filter(([time, users]) => users.size > 1);


                    // Renderizar la vista con los detalles de la reunión
                    return res.render('meetings', { meeting, commonAvailability, otherAvailability });
                } catch (error) {
                    console.error("Error al obtener la reunión:", error);
                    return res.status(500).send('<h1>Error al obtener la reunión</h1>');
                }
            }
        
            if (req.method === 'POST') {
                // Manejar el envío del formulario para añadir disponibilidad
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
            }
        
            // Si no es GET ni POST, devolver un error
            res.status(405).send('<h1>Método no permitido</h1>');
        });

        // Start server after connecting to MongoDB
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
    }
}

// Call the function to connect to the database
connectToDatabase();
