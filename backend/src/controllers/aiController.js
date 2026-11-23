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

IMPORTANT NEW RULE:
- At least 7-8 questions MUST be coding/programming based
  (example: write a program / write a function / implement logic / use loops / solve problem)

STRICT RULES:
- Exactly 18-20 questions.
- include both theoretical & coding questions
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
// exports.generateAnswers = async (req, res) => {
//     try {
//         const { questions } = req.body;

//         if (!questions || !Array.isArray(questions) || questions.length === 0) {
//             return res.status(400).json({ message: "Questions required" });
//         }

//         const prompt = `
// You must respond ONLY in valid JSON.

// STRICT REQUIRED FORMAT:
// {
//   "answers": {
//     "1": "text",
//     "2": "text",
//     "3": "text"
//   }
// }

// RULES:
// - answers MUST be an object
// - keys MUST be numeric strings starting from "1"
// - NEVER return an array in answers
// - NEVER nest objects inside answers
// - NEVER leave answers empty
// - NEVER combine multiple answers under one key
// - NO markdown
// - NO backticks
// - NO headings
// - NO comments
// - NO extra text before or after JSON

// CODING QUESTIONS:
// - return ONLY the function/method — NOT a full program
// - NEVER output public class or main method
// - NEVER output imports
// - NEVER wrap code in a class
// - NEVER combine code into one line
// - code MUST be multi-line
// - code MUST include indentation
// - each statement MUST be on its own line
// - AFTER code, write 1 short sentence explanation
// - all inside ONE string


// THEORY ANSWERS:
// - MAX 2 sentences

// Questions:
// ${JSON.stringify(questions)}
// `;





//         const completion = await client.chat.completions.create({
//             messages: [{ role: "user", content: prompt }],
//             model: "llama-3.1-8b-instant",
//             temperature: 0.3,
//         });

//         const raw = completion?.choices?.[0]?.message?.content;
//         console.log("RAW AI OUTPUT ---->");
//         console.log(raw);

//        let parsed;
// try {
//     parsed = JSON.parse(raw);
// } catch {
//     const fixed = raw
//         .replace(/,\s*}/g, "}")
//         .replace(/,\s*]/g, "]")
//         .trim();

//     parsed = JSON.parse(fixed);
// }

// // convert answers into array ALWAYS
// let arr;
// if (Array.isArray(parsed.answers)) {
//     arr = parsed.answers;
// } else {
//     arr = Object.values(parsed.answers);
// }

// res.json({
//     success: true,
//     answers: arr
// });




//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };
exports.generateAnswers = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Questions required" });
        }

        const prompt = `
Respond ONLY in valid JSON.
Format:
{
  "answers": {
    "1": "text",
    "2": "text"
  }
}

Rules:
- answers must be an object
- keys must be numbers as strings
- each answer MUST be a string
- do NOT add explanation
- NO markdown
- NO comments
`;

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt + JSON.stringify(questions) }],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
        });

        const raw = completion.choices[0].message.content;
        // console.log("RAW AI OUTPUT ---->");
        // console.log(raw);

        // FIX parser
        let json;

        try {
            json = JSON.parse(raw);
        } catch (err) {
            const fixed = raw
                .replace(/,\s*}/g, "}")
                .replace(/,\s*]/g, "]")
                .replace(/[\n\r\t]/g, " ");
            json = JSON.parse(fixed);
        }

        let arr;

        if (Array.isArray(json.answers)) {
            arr = json.answers;
        } else {
            arr = Object.values(json.answers);
        }

        res.json({ success: true, answers: arr });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "AI crashed parsing output" });
    }
};
