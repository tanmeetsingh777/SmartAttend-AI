require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

const PORT = process.env.PORT || 5000;

const ensureDemoUsers = async () => {
  if (await User.exists({})) return;

  await User.create([
    {
      fullName: "System Administrator",
      email: "admin@university.edu",
      password: "password123",
      role: "admin",
      isActive: true,
    },
    {
      fullName: "Teacher 1",
      email: "teacher1@university.edu",
      password: "password123",
      role: "teacher",
      isActive: true,
    },
  ]);

  console.log("[Demo Users] Admin and teacher accounts created.");
};

// Connect to MongoDB
connectDB().then(() => {
  ensureDemoUsers().then(() =>
    app.listen(PORT, () => {
      console.log(
        `===========================================================`,
      );
      console.log(` SmartAttend AI Express API Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        ` MongoDB: ${process.env.MONGO_URI || "mongodb://localhost:27017/smartattend"}`,
      );
      console.log(
        `===========================================================`,
      );
    }),
  );
});
