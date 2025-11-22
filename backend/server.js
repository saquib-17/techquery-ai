const app = require("./src/app");
const dotenv = require("dotenv");
const connectDb = require("./src/config/db");
const testRoute = require("./src/routes/testRoute");
const authRoute = require("./src/routes/authRoute");
const userRoute = require("./src/routes/userRoute");
const aiRoute = require("./src/routes/aiRoute");

dotenv.config();

// Connect to DB
connectDb();

// Test route
app.use("/api/test", testRoute);

// Auth route
app.use("/api/auth", authRoute);

// User route
app.use("/api/user", userRoute);

// AI route
app.use("/api/ai", aiRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
