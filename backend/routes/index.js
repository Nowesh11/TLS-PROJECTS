const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");

// Mock data for frontend pages
const mockData = {
  featuredBooks: [
    { id: "1", title: "Tamil History", author: "Dr. Rajesh Kumar", coverImage: "/assets/book1.jpg" },
    { id: "2", title: "Tamil Poetry", author: "Kavitha Nair", coverImage: "/assets/book2.jpg" },
    { id: "3", title: "Tamil Cuisine", author: "Chef Anand", coverImage: "/assets/book3.jpg" }
  ],
  upcomingEvents: [
    { id: "1", title: "Book Reading", date: "2023-06-15", location: "Chennai" },
    { id: "2", title: "Poetry Contest", date: "2023-06-20", location: "Online" }
  ]
};

// Test route
router.get("/test", (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Test route working' });
});

// Frontend views route handler
router.get("/frontend/views/:page", (req, res) => {
  const page = req.params.page;
  const path = require('path');
  const fs = require('fs');
  
  const filePath = path.join(__dirname, '../../frontend/views', page);
  console.log(`Frontend views route hit - Serving: ${page} -> ${filePath}`);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.log(`Frontend view file not found: ${filePath}`);
    res.status(404).sendFile(path.join(__dirname, '../../frontend/views/404.html'));
  }
});

// Home page
router.get("/", (req, res, next) => {
  try {
    const path = require('path');
    const filePath = path.join(__dirname, '../../frontend/views/index.html');
    console.log('Home route hit - Attempting to serve:', filePath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return next(new Error('index.html not found'));
    }
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        next(err);
      } else {
        console.log('Successfully served index.html');
      }
    });
  } catch (error) {
    console.error('Error in home route:', error);
    next(error);
  }
});

// Login page
router.get("/login", (req, res) => {
  // If user is already logged in, redirect to home page
  if (req.session.user) {
    return res.redirect("/");
  }
  
  res.sendFile("login.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
});

// Signup page
router.get("/signup", (req, res) => {
  // If user is already logged in, redirect to home page
  if (req.session.user) {
    return res.redirect("/");
  }
  
  res.sendFile("signup.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
});

// Forgot password page
router.get("/forgot-password", (req, res) => {
  res.sendFile("forgot-password.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
});

// Reset password page
router.get("/reset-password", (req, res) => {
  res.sendFile("reset-password.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
});

// Notifications page
router.get("/notifications", (req, res) => {
  res.sendFile("notifications.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
});

// Admin dashboard (temporary route without authentication for testing)
router.get("/admin-test", async (req, res) => {
  try {
    // Serve the HTML file for testing
    res.sendFile("admin.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
  } catch (err) {
    console.error(err);
    res.status(500).sendFile("error.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
  }
});

// Admin dashboard (with authentication)
router.get("/admin", protect, authorize("admin"), async (req, res) => {
  try {
    // In a real application, you would fetch actual data from your database
    // For this project, we'll use mock data
    const dashboardData = {
      totalUsers: 120,
      totalBooks: 450,
      totalEbooks: 230,
      recentUsers: [
        { id: "1", name: "John Doe", email: "john@example.com", joinedDate: "2023-05-15" },
        { id: "2", name: "Jane Smith", email: "jane@example.com", joinedDate: "2023-05-14" },
        { id: "3", name: "Bob Johnson", email: "bob@example.com", joinedDate: "2023-05-13" }
      ],
      recentBooks: [
        { id: "1", title: "Tamil History", author: "Dr. Rajesh Kumar", addedDate: "2023-05-10" },
        { id: "2", title: "Tamil Poetry", author: "Kavitha Nair", addedDate: "2023-05-09" },
        { id: "3", title: "Tamil Cuisine", author: "Chef Anand", addedDate: "2023-05-08" }
      ]
    };
    
    // Serve the HTML file instead of rendering EJS
    res.sendFile("admin.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
  } catch (err) {
    console.error(err);
    res.status(500).sendFile("error.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
  }
});

// Catch-all route to serve static HTML files (excluding API routes)
router.get("/:page", (req, res) => {
  let page = req.params.page;
  
  // Exclude API routes
  if (page === "api") {
    return res.status(404).json({ success: false, error: "API endpoint not found" });
  }
  
  // Handle .html extension - remove it if present
  if (page.endsWith('.html')) {
    page = page.slice(0, -5);
  }
  
  const validPages = ["about", "books", "ebooks", "projects", "contact", "login", "signup", "forgot-password", "notifications", "admin", "response", "reset-password", "detail", "admin-books", "error"];
  
  if (validPages.includes(page)) {
    const filePath = page + ".html";
    const fullPath = require('path').join(__dirname, '../../frontend/views', filePath);
    console.log(`Serving page: ${page} -> ${filePath}`);
    console.log(`Full path: ${fullPath}`);
    
    // Check if file exists before serving
    const fs = require('fs');
    if (fs.existsSync(fullPath)) {
      res.sendFile(fullPath);
    } else {
      console.log(`File not found: ${fullPath}`);
      res.status(404).sendFile(require('path').join(__dirname, '../../frontend/views/404.html'));
    }
  } else {
    console.log(`Page not found: ${page}`);
    res.status(404).sendFile(require('path').join(__dirname, '../../frontend/views/404.html'));
  }
});

// Handle any other routes that don't match the patterns above
// This will be handled by Express's default 404 behavior

module.exports = router;