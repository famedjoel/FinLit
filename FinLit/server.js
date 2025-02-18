import express from "express";
import cors from "cors";

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 5000;

// Define custom CORS options
const corsOptions = {
  origin: ["http://localhost:5174"], // Allow frontend requests
  credentials: true, // Allow cookies if needed
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parses JSON requests


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
