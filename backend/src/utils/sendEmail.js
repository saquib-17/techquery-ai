// sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false },
  debug: true,
  connectionTimeout: 20000,
  greetingTimeout: 10000,
  socketTimeout: 20000
});

// Run once at startup to see status in logs
transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP verify failed:", err && err.code ? `${err.code} - ${err.message}` : err);
  } else {
    console.log("SMTP ready to send emails");
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

  try {
    const info = await transporter.sendMail({
      from: `"TechQuery AI" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🎉 Welcome to TechQuery AI — Your Account is Ready!",
      html,
    });
    console.log("Email sent:", info && info.messageId ? info.messageId : info);
    return { ok: true, info };
  } catch (err) {
    // Log useful short error for you to paste here
    console.error("sendWelcomeEmail error:", err && err.code ? `${err.code} - ${err.message}` : err);
    return { ok: false, error: err };
  }
};
