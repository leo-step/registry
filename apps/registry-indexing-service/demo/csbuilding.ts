import express from 'express';

const app = express();

app.use(express.json());

app.post('/search', async (req, res) => {
  const jsonData = req.body;
  try {
    const response = {
      "name": "CS Building Restaurant Co-op",
      "providers": [
          {
            "id": 101,
            "name": "Tony's Pizzeria",
            "address": "123 Main St, Anytown, USA",
            "phone": "555-0101",
            "specialties": ["Neapolitan Pizza", "Margherita"],
            "rating": 4.5
          },
          {
            "id": 102,
            "name": "Napoli Pizza",
            "address": "456 Elm St, OtherTown, USA",
            "phone": "555-0202",
            "specialties": ["Sicilian Pizza", "Pepperoni"],
            "rating": 4.7
          },
          {
            "id": 103,
            "name": "The Pizza Corner",
            "address": "789 Oak St, Smallville, USA",
            "phone": "555-0303",
            "specialties": ["Deep Dish Pizza", "Meat Lovers"],
            "rating": 4.3
          },
      ]
    };
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// localhost port 
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`PSN is running on http://localhost:${PORT}`);
});

