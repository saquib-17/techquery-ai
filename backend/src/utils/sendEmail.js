// sendEmail.js (Resend version)
const { Resend } = require('resend');
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendWelcomeEmail = async (to, name) => {
  try {
    await resend.emails.send({
      from: "TechQuery AI <onboarding@resend.dev>", // works without setup
      to: to,
      subject: "🎉 Welcome to TechQuery AI!",
      html: `
        <h2>Welcome ${name} 👋</h2>
        <p>Your TechQuery AI account is now ready!</p>
        <p>Start practicing here:</p>

        <a href="https://techquery-ai.vercel.app/login"
          style="padding:10px 18px;background:#4F46E5;color:white;border-radius:6px;text-decoration:none">
          Start Using TechQuery AI →
        </a>

        <br/><br/>
        <small>Welcome aboard 🚀</small>
      `
    });

    console.log("Resend Email Sent to:", to);
  } catch (err) {
    console.error("Resend Error:", err?.response?.data || err.message);
  }
};
