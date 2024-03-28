import express from 'express';
import { prisma } from "../db.server";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors())

app.post('/search', async (req, res) => {
  const jsonData = req.body;
  try {
    // const data = await prisma.yourModel.findMany();

    // Query to see in PostGIS whether the point is in the polygon [TODO]
    // CS building: 40.3499433,-74.652273
    // http://localhost:3000/?lat=40.298865&long=-74.736349
    const coordinates = jsonData.coordinates
    const lat = coordinates.latitude
    const long = coordinates.longitude
    const data: any = await prisma.$queryRaw`SELECT name, "callbackUrl", ST_AsText(coords) as coords FROM "NodeEntry" 
                                        WHERE ST_Within(
                                          ST_SetSRID(ST_Point(${lat}, ${long}), 4326), 
                                          coords
                                        );`
    console.log(data);
    const results = []
    for (let i = 0; i < data.length; i++) {
      const url = data[i].callbackUrl + "search";
      const response = await fetch(url, {
          method: 'POST', // Specify the method
          headers: {
              'Content-Type': 'application/json' // Specify the content type as JSON
          },
          body: JSON.stringify(jsonData) // Convert the JavaScript object to a JSON string
      });
      // currently gets all of the data from the prisma
      const result = await response.json();
      results.push(result)
    }
    return res.json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// localhost port 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway is running on http://localhost:${PORT}`);
});

