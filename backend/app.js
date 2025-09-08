const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const errorHandler = require("./middleware/error");
const net = require("net");

// Security middleware imports
const {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  helmetConfig,
  mongoSanitize,
  hppProtection,
  validateInput,
  securityHeaders,
  securityLogger,
  validateFileUpload
} = require("./middleware/security");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "config", ".env") });

// Check if MongoDB is available synchronously
const isMongoDBAvailableSync = () => {
  try {
    const socket = new net.Socket();
    socket.setTimeout(100);
    
    let isAvailable = false;
    socket.on("connect", () => {
      isAvailable = true;
      socket.destroy();
    });
    
    socket.on("timeout", () => {
      socket.destroy();
    });
    
    socket.on("error", () => {
      // MongoDB not available
    });
    
    socket.connect(27017, "localhost");
    
    // Wait briefly for connection
    const start = Date.now();
    while (Date.now() - start < 100) {
      // Brief wait
    }
    
    return isAvailable;
  } catch (error) {
    return false;
  }
};

// Force real MongoDB usage - no mock database
console.log("[APP] Initializing with real MongoDB connection");
let useMemoryStore = false;

// Import routes
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const bookRoutes = require("./routes/books");
const ebookRoutes = require("./routes/ebooks");
const projectRoutes = require("./routes/projects");
// Contact form routes removed - const messageRoutes = require("./routes/messages");
const contentRoutes = require("./routes/content");
const teamRoutes = require("./routes/team");
const teamMembersRoutes = require("./routes/team-members");
const uploadRoutes = require("./routes/upload");
const announcementRoutes = require("./routes/announcements");
const notificationRoutes = require("./routes/notifications");
const chatRoutes = require("./routes/chat");
const purchasedBooksRoutes = require("./routes/purchasedBooks");
// Removed project participants routes
const postersRoutes = require("./routes/posters");
const cartRoutes = require("./routes/cart");
const paymentSettingsRoutes = require("./routes/paymentSettings");
const websiteContentRoutes = require("./routes/websiteContent");
const purchaseRoutes = require("./routes/purchase");
const contentKeyValueRoutes = require("./routes/contentKeyValue");
const activityRoutes = require("./routes/activity");
const slideshowRoutes = require("./routes/slideshow");
const slidesRoutes = require("./routes/slides");
const activitiesRoutes = require("./routes/activities");
const initiativesRoutes = require("./routes/initiatives");

const fileManagerRoutes = require("./routes/fileManager");
const recruitmentRoutes = require("./routes/recruitment");
const formsRoutes = require("./routes/forms");

// Initialize Express app
const app = express();

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security middleware - must be applied early
app.use(securityHeaders);
app.use(helmetConfig);
app.use(securityLogger);

// Apply rate limiting selectively - exclude public routes
app.use((req, res, next) => {
  // Skip rate limiting for:
  // 1. Public website-content API routes
  // 2. Static files (HTML, CSS, JS, images)
  // 3. Frontend views and assets
  // 4. Public API endpoints for content loading
  if (
    (req.path.startsWith('/api/website-content/') && req.method === 'GET') ||
    (req.path.startsWith('/api/books') && req.method === 'GET') ||
    (req.path.startsWith('/api/ebooks') && req.method === 'GET') ||
    (req.path.startsWith('/api/projects') && req.method === 'GET') ||
    (req.path.startsWith('/api/posters') && req.method === 'GET') ||
    (req.path.startsWith('/frontend/') && req.method === 'GET') ||
    (req.path.startsWith('/uploads/') && req.method === 'GET') ||
    (req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i) && req.method === 'GET')
  ) {
    return next();
  }
  // Apply rate limiting to all other routes
  generalLimiter(req, res, next);
});

// app.use(mongoSanitize); // Disabled due to compatibility issues with Node.js version
app.use(hppProtection);

// Body parsing middleware
app.use(express.json({ 
  charset: "utf-8",
  limit: "10mb" // Prevent large payload attacks
}));
app.use(express.urlencoded({ 
  extended: true, 
  charset: "utf-8",
  limit: "10mb"
}));
app.use(cookieParser());

// Set charset for API responses only
app.use("/api", (req, res, next) => {
  res.charset = "utf-8";
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});
// CORS configuration - More permissive for debugging
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("Request with no origin - allowing");
      return callback(null, true);
    }
    
    const allowedOrigins = [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:8000",
      "http://127.0.0.1:8000",
      "null" // Allow null origin for local file access
    ];
    
    console.log("CORS check - Origin:", origin);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin === "null") {
      console.log("CORS allowing origin:", origin);
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      // For debugging, allow all origins temporarily
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-Session-ID",
    "Cache-Control",
    "Pragma"
  ],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request logging middleware for debugging
app.use("/api", (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Origin:", req.get("Origin"));
  console.log("User-Agent:", req.get("User-Agent"));
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  next();
});

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  abortOnLimit: true
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "tamilsocietysecret",
  resave: false,
  saveUninitialized: false,
  store: useMemoryStore 
    ? null // Use memory store for mock database mode
    : MongoStore.create({
        mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety",
        collectionName: "sessions"
      }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Connect to MongoDB
const connectDB = require("./config/db");
const WebsiteContentSection = require("./models/WebsiteContentSection");

// Connect to database
connectDB()
  .then(async () => {
    console.log("Database connected successfully");
    console.log("[STARTUP] Skipping automatic seeding to prevent server hang");
    console.log("[STARTUP] Server ready to accept requests");
  })
  .catch(err => console.error("Database connection error:", err));

// API Routes (must come before static file serving)

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/projects", projectRoutes);
// Contact form API routes removed - app.use("/api/messages", messageRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/pages", contentRoutes); // Add direct pages route mapping

// Direct route handler for /api/teams to ensure compatibility (must come before /api/team)
app.get("/api/teams", async (req, res) => {
  try {
    const Team = require("./models/Team");
    const { position, status } = req.query;
    
    let query = {};
    
    if (position) {
      query.position = position;
    }
    
    if (status) {
      query.status = status;
    } else {
      query.status = "active"; // Default to active members for public view
    }
    
    const hierarchyOrder = Team.getHierarchyOrder();
    
    const teamMembers = await Team.find(query)
      .sort([
        ["position", 1],
        ["order", 1],
        ["name", 1]
      ]);
    
    // Sort by hierarchy
    teamMembers.sort((a, b) => {
      const orderA = hierarchyOrder[a.position] || 999;
      const orderB = hierarchyOrder[b.position] || 999;
      
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.order - b.order;
    });
    
    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (error) {
    console.error("Teams API error:", error);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

app.use("/api/team", teamRoutes);
app.use("/api/team-members", teamMembersRoutes);

app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/purchased-books", purchasedBooksRoutes);
// Removed project participants route usage
app.use("/api/posters", postersRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/website-content", websiteContentRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/content", contentKeyValueRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/slideshow", slideshowRoutes);
app.use("/api/slides", slidesRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/initiatives", initiativesRoutes);

app.use("/api/files", fileManagerRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/forms", formsRoutes);

// Health check endpoint for testing
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Serve uploads directory at /uploads path
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Serve static files from root directory - COMMENTED OUT to fix error.html path issue
// app.use(express.static(path.join(__dirname, "../")));

// Also serve from public directory for backward compatibility
app.use(express.static(path.join(__dirname, "public")));

// Serve frontend static files
app.use("/frontend/public", express.static(path.join(__dirname, "../frontend/public")));

// Serve entire frontend directory for better asset access
app.use(express.static(path.join(__dirname, "../frontend")));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Frontend routes
app.use("/", indexRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;