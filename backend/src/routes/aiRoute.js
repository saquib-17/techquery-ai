const express = require("express");

const {
    generateQuestions,
    saveQuestions,
    getMyQuestions,
    deleteQuestions,
    updateTitle,
    generateAnswers
} = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();


// Generate AI Questions
router.post("/generate-questions", protect, generateQuestions);

// Save Question Set
router.post("/save-questions", protect, saveQuestions);

// Get All Saved Sets Of Logged User
router.get("/my-questions", protect, getMyQuestions);

// Delete A Set
router.delete("/questions/:id", protect, deleteQuestions);

// Update Title
router.patch("/questions/:id", protect, updateTitle);

// Generate AI Answers
router.post("/answer-questions", protect, generateAnswers);


module.exports = router;
