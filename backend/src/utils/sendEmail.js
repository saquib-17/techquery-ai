const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendWelcomeEmail = async (to, name) => {
  const html = `
    <h2>Welcome to <span style="color:#4F46E5">TechQuery AI</span>, ${name} 👋</h2>

    <p>We're happy to see you join our platform.</p>

    <p>With TechQuery AI you can:</p>

    <ul>
      <li>Generate realistic interview questions</li>
      <li>Save question sets for later</li>
      <li>Generate AI-based Answers</li>
      <li>Export PDFs</li>
    </ul>

    <p>You're all set! Begin practicing now.</p>

    <a href="https://techquery-ai.vercel.app/login"
      style="padding:10px 18px;background:#4F46E5;color:white;border-radius:6px;text-decoration:none">
      Start Using TechQuery AI →
    </a>

    <br/><br/>
    <small>Welcome aboard 🚀</small>
  `;

  await transporter.sendMail({
    from: `"TechQuery AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Welcome to TechQuery AI — Your Account is Ready!",
    html,
  });
};
