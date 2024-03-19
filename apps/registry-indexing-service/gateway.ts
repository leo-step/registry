import express from 'express';
import { prisma } from "./db.server";

const app = express();

app.get('/', async (req, res) => {
  try {
    // const data = await prisma.yourModel.findMany();
    const data = await prisma.$queryRaw`SELECT name, ST_AsText(coords) as coords FROM "NodeEntry";`

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


//