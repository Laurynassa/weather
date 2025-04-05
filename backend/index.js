const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Endpoint to log selected city
app.post("/log", (req, res) => {
  const { city, timestamp } = req.body;
  if (!city || !timestamp) {
    return res.status(400).json({ error: "City and timestamp are required" });
  }

  console.log(`City selected: ${city}, Timestamp: ${timestamp}`);
  res.json({ message: "Logged successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
