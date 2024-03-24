import express from 'express';
import { prisma } from "../db.server";

const app = express();

app.use(express.json());

app.post('/search', async (req, res) => {
  const jsonData = req.body;
  try {
    console.log(jsonData);
    // acknowledgement
    const response = {
      "psn_parameters": {
        "uid": "node-uid-456",
        "name": "Provider Node Name",
        "callback_url": "https://provider.example.com/callback"
      },
      "message": {
        "ack": {
          "status": "ACK",
          "timestamp": "2024-03-24T12:34:56Z",
          "message_id": "abcdef1234567890",
          "transaction_id": "1234567890abcdef"
        }
      }
    };
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// localhost port 
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PSN is running on http://localhost:${PORT}`);
});

