require("dotenv").config();
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const Question = require("../models/Question");

/* -----------------------------------------------
   Generate AI QUESTIONS
------------------------------------------------*/
exports.generateQuestions = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ message: "Resume and Job Description required" });
        }

        const prompt = `
You are an expert technical interviewer.

Generate 18-20 realistic, relevant, high-quality technical interview questions
based on the Resume + Job Description.

STRICT RULES:
- Exactly 18-20 questions.
- no numbering
- no bullets
- no categories
- no headings
- no blank lines
- no explanations
- no intro
- no outro
- each question MUST be on its own line

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.45,
        });

        const raw = completion.choices[0].message.content;

        const list = raw.split("\n").filter(q => q.trim() !== "");

        // ADD NUMBERING HERE ONLY
        const numbered = list.map((q, i) => `${i + 1}. ${q}`);

        res.json({
            success: true,
            questions: numbered,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* -----------------------------------------------
   SAVE QUESTIONS
------------------------------------------------*/
exports.saveQuestions = async (req, res) => {
    try {
        const { title, questions } = req.body;

        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Title and questions array are required" });
        }

        const newSet = await Question.create({
            user: req.user._id,
            title,
            questions,
        });

        res.status(201).json({
            success: true,
            message: "Saved successfully",
            data: newSet,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* -----------------------------------------------
   GET ALL USER SETS
------------------------------------------------*/
exports.getMyQuestions = async (req, res) => {
    try {
        const sets = await Question.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            total: sets.length,
            data: sets,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* -----------------------------------------------
   DELETE USER SET
------------------------------------------------*/
exports.deleteQuestions = async (req, res) => {
    try {
        const { id } = req.params;

        const found = await Question.findOne({ _id: id, user: req.user._id });

        if (!found) {
            return res.status(404).json({ message: "Not found" });
        }

        await Question.deleteOne({ _id: id });

        res.json({
            success: true,
            message: "Deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* -----------------------------------------------
   UPDATE TITLE
------------------------------------------------*/
exports.updateTitle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const found = await Question.findOne({ _id: id, user: req.user._id });

        if (!found) return res.status(404).json({ message: "Not found" });
        if (!title?.trim()) return res.status(400).json({ message: "Title required" });

        found.title = title;
        await found.save();

        res.json({
            success: true,
            message: "Updated",
            data: found,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* -----------------------------------------------
   GENERATE ANSWERS — JSON MODE
------------------------------------------------*/
exports.generateAnswers = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Questions required" });
        }

        const prompt = `
Respond ONLY in PERFECT JSON.

{
  "answers": [
    "answer here",
    "answer here"
  ]
}

RULES:
- answers[] length MUST match questions length
- no markdown
- no backticks
- no comments
- no numbering
- no bullets
- no prefixes like Q: or A:
- each answer must be complete & professional
- 3–6 sentences per answer

Questions:
${JSON.stringify(questions)}
`;

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
        });

        const raw = completion.choices[0].message.content;

        const parsed = JSON.parse(raw);

        res.json({
            success: true,
            answers: parsed.answers.map((a, i) => `${i + 1}. ${a}`),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
