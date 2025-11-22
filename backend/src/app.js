const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors({
  origin: ['https://techquery-ai.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Backend API is working!" });
});

module.exports = app;
