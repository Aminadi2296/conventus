const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const groupAvailability = require('../utils/availability');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'DELETE'],
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const URL = process.env.DATABASE_URL;

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
    console.log('Connected to MongoDB');

    const db = client.db();

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Create a meeting
    app.post('/api/meetings', async (req, res) => {
      const { title, description } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'A title is required' });
      }

      const meetingId = generateRandomId(6);
      const newMeeting = {
        title,
        id: meetingId,
        description: description || '',
        proposals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await db.collection('meetings').insertOne(newMeeting);
        res.status(201).json({ meetingId });
      } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
      }
    });

    // Get meeting by ID
    app.get('/api/meetings/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const meeting = await db.collection('meetings').findOne({ id });

        if (!meeting) {
          return res.status(404).json({ error: 'Meeting not found' });
        }

        if (!Array.isArray(meeting.proposals)) {
          meeting.proposals = [];
        }

        // Build availability map
        const availabilityMap = {};
        const userCount = meeting.proposals.length;

        meeting.proposals.forEach(proposal => {
          if (!Array.isArray(proposal.availability)) return;
          proposal.availability.forEach(time => {
            if (!availabilityMap[time]) availabilityMap[time] = new Set();
            availabilityMap[time].add(proposal.username);
          });
        });

        // Serialize Sets to arrays for JSON
        const commonAvailability = Object.entries(availabilityMap)
          .filter(([, users]) => users.size === userCount && userCount > 0)
          .map(([time, users]) => ({ time, users: [...users] }));

        const otherAvailability = Object.entries(availabilityMap)
          .filter(([, users]) => users.size > 1 && (userCount === 0 || users.size < userCount))
          .map(([time, users]) => ({ time, users: [...users], count: users.size }));

        // Format proposals with grouped availability
        const formattedProposals = meeting.proposals.map(proposal => {
          const grouped = proposal.availability.reduce((acc, time) => {
            const [day, hour] = time.split('-');
            if (!acc[day]) acc[day] = [];
            acc[day].push(hour);
            return acc;
          }, {});

          const groupedFormatted = Object.entries(grouped).map(([day, hours]) => ({
            day,
            ranges: groupAvailability(hours),
          }));

          return {
            username: proposal.username,
            groupedAvailability: groupedFormatted,
            rawAvailability: proposal.availability,
          };
        });

        res.json({
          meeting: {
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            createdAt: meeting.createdAt,
          },
          proposals: formattedProposals,
          commonAvailability,
          otherAvailability,
        });
      } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Failed to fetch meeting' });
      }
    });

    // Add availability to a meeting
    app.post('/api/meetings/:id/availability', async (req, res) => {
      const { id } = req.params;
      const { username, availability } = req.body;

      if (!username || !availability || availability.length === 0) {
        return res.status(400).json({ error: 'Username and availability are required' });
      }

      try {
        const result = await db.collection('meetings').updateOne(
          { id },
          {
            $push: {
              proposals: { username, availability, createdAt: new Date() },
            },
            $set: { updatedAt: new Date() },
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json({ message: 'Availability added successfully' });
      } catch (error) {
        console.error('Error adding availability:', error);
        res.status(500).json({ error: 'Failed to add availability' });
      }
    });

    // Delete a meeting
    app.delete('/api/meetings/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const result = await db.collection('meetings').deleteOne({ id });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json({ message: 'Meeting deleted successfully' });
      } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Failed to delete meeting' });
      }
    });

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

connectToDatabase();
