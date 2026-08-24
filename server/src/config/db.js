const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/claimassist";
  try {
    await mongoose.connect(uri);
    console.log(`[db] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    console.error(
      "[db] Make sure MongoDB is running locally, or set MONGO_URI in your .env file. " +
      "See README.md for setup instructions."
    );
    process.exit(1);
  }
}

module.exports = connectDB;
