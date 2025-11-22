require("dotenv").config();
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.generateQuestions = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ message: "Resume and Job Description required" });
        }

        const prompt = `
Using the Resume and Job Description below, generate 15–20 technical interview questions that are relevant and realistic to the candidate’s skills and the required role.

Present the output in four sections, written exactly like normal text headings (not formatted as bold, not numbered, not bulleted):

Easy Questions :
Medium Questions : 
Hard Questions :
Company-specific questions commonly asked

Under each section, write the questions directly as simple lines of text without numbering, without bullet points, without symbols, and without markers of any kind. Just clean question sentences, one after another, each on a new line.

Ensure the questions feel natural and practical, the way a real interviewer would speak — not generic, not textbook-like.

Include coding/programming challenges only if the role or resume suggests it is relevant. If applicable, include coding questions inside Medium or Hard sections naturally.

Do not include any explanation, description, intro text, closing text, or summaries. Only the four section labels and the questions under each.

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.5,
        });

        const aiResponse = chatCompletion.choices[0].message.content;

        res.json({
            success: true,
            questions: aiResponse.split("\n").filter(q => q.trim() !== ""),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
