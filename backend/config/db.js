const mongoose = require("mongoose");
const mockMongoose = require("./mockDb");
const net = require("net");

// Function to check if MongoDB is available
const isMongoDBAvailable = () => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000; // 2 seconds timeout
    
    socket.setTimeout(timeout);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on("error", () => {
      resolve(false);
    });
    
    socket.connect(27017, "localhost");
  });
};

const connectDB = async () => {
  try {
    // Set mongoose options for better connection handling
    mongoose.set("strictQuery", false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tamil-language-society", {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("Database connected successfully");
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error("Failed to connect to MongoDB. Please ensure MongoDB is running.");
    process.exit(1);
  }
};

module.exports = connectDB;