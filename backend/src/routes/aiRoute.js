const express = require("express");
const { generateQuestions } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware"); // only logged-in users can generate questions

const router = express.Router();

router.post("/generate-questions", protect, generateQuestions);

module.exports = router;
