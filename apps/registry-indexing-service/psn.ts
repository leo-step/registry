import express from 'express';
import { prisma } from "./db.server";

const app = express();

app.get('/', async (req, res) => {
  console.log("SUCCESS!!!");
});

// localhost port 
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PSN is running on http://localhost:${PORT}`);
});

