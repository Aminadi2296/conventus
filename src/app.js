const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const URL = process.env.DATABASE_URL;

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
            res.sendFile(path.join(__dirname, '../views', 'index.html')); // Ensure this file exists in your "public" folder
        });

        app.get('/meetings', (req, res) => {
            res.sendFile(path.join(__dirname, '../views', 'index.html')); // Ensure this file exists in your "public" folder
        });

        app.get('/meetings/:id', async (req, res) => {
            const { id } = req.params; // Obtener el ID desde los parámetros de la solicitud
          
            try {
              const meeting = await db.collection('meetings').findOne({ id }); // Buscar la reunión por ID
              if (!meeting) {
                return res.status(404).send('<h1>Reunión no encontrada</h1>'); // Manejar caso cuando no se encuentra la reunión
              }
          
              // Responder con los detalles de la reunión en HTML
              res.send(`
                <!DOCTYPE html>
                <html lang="es">
                  <head><title>Detalles de la Reunión</title></head>
                  <body>
                    <h1>Detalles de la Reunión</h1>
                    <p><strong>ID:</strong> ${meeting.id}</p>
                    <p><strong>Título:</strong> ${meeting.title}</p>
                    <p><strong>Descripción:</strong> ${meeting.description}</p>
                    <p><strong>Creada en:</strong> ${new Date(meeting.createdAt).toLocaleString()}</p>
                    <a href="/">Volver a Página Principal</a> <!-- Enlace para volver al formulario -->
                  </body>
                </html>
              `);
            } catch (error) {
              console.error("Error al obtener la reunión:", error);
              res.status(500).send('<h1>Error al obtener la reunión</h1>');
            }
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
