// /* eslint-disable no-undef */
// // app.js
// import express from 'express';
// import cors from 'cors';
// import { setupAuthRoutes } from './routes/authRoutes.js';

// // Create a function that returns a fresh Express app instance
// export function createApp() {
//   const app = express();
  
//   // Define custom CORS options that allow all origins
//   const corsOptions = {
//     origin: '*', // Allow all origins for testing
//     credentials: true, // Allow cookies if needed
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
//   };
  
//   // Middleware
//   app.use(cors(corsOptions));
//   app.use(express.json({limit: '50mb'})); // Parses JSON requests
  
//   // Log all requests for debugging
//   app.use((req, res, next) => {
//     console.log(`${req.method} ${req.url}`);
//     next();
//   });
  
//   // Setup routes
//   setupAuthRoutes(app);
  
//   // Basic health check endpoint
//   app.get("/health", (req, res) => {
//     res.json({ status: "Server is running" });
//   });
  
//   return app;
// }

// // Only start the server if this file is run directly (not imported)
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const PORT = process.env.PORT || 7900;
//   const app = createApp();
//   app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }

// export default createApp;