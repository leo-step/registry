import express from 'express';

const app = express();

app.use(express.json());

app.post('/search', async (req, res) => {
  const jsonData = req.body;
  try {
    const response = {
      "name": "Colo Restaurant Co-op",
      "providers": [
          {
            "id": 104,
            "name": "Pizza Planet",
            "address": "321 Maple St, Springfield, USA",
            "phone": "555-0404",
            "specialties": ["Vegan Pizza", "Gluten-Free Pizza"],
            "rating": 4.8
          },
          {
            "id": 105,
            "name": "Big Apple Pizzeria",
            "address": "654 Pine St, Metropolis, USA",
            "phone": "555-0505",
            "specialties": ["New York-Style Pizza", "Cheese Pizza"],
            "rating": 4.2
          }
        ]
    };
    
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// localhost port 
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`PSN is running on http://localhost:${PORT}`);
});

