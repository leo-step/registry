import express from 'express';
import { prisma } from "./db.server";

const app = express();

app.get('/', async (req, res) => {
  try {
    // const data = await prisma.yourModel.findMany();

    // Query to see in PostGIS whether the point is in the polygon [TODO]
    // CS building: 40.3499433,-74.652273
    // http://localhost:3000/?lat=40.298865&long=-74.736349
    const lat = parseFloat((req.query.lat as string));
    const long = parseFloat((req.query.long as string));
    console.log(lat, long);
    const data = await prisma.$queryRaw`SELECT name, ST_AsText(coords) as coords FROM "NodeEntry" 
                                        WHERE ST_Within(
                                          ST_SetSRID(ST_Point(${lat}, ${long}), 4326), 
                                          coords
                                        );`

    // currently gets all of the data from the prisma 
    res.json(data);
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

