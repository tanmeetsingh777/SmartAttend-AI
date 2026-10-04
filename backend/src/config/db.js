const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/smartattend";
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(
      `[MongoDB Warning]: Primary connection to ${uri} failed (${error.message}). Attempting embedded MongoMemoryServer fallback...`,
    );
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const dbPath = path.join(__dirname, "..", "..", ".data", "mongodb");
      fs.mkdirSync(dbPath, { recursive: true });
      const mongod = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "smartattend",
          dbPath,
        },
      });
      const memUri = mongod.getUri("smartattend");
      const conn = await mongoose.connect(memUri);
      console.log(`[MongoDB Embedded Connected] Memory Server URI: ${memUri}`);
    } catch (memError) {
      console.error(`[MongoDB Connection Error]: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
