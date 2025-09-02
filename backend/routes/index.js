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

// Home page
router.get("/", (req, res) => {
  res.sendFile("index.html", { root: "../" });
});

// Login page
router.get("/login", (req, res) => {
  // If user is already logged in, redirect to home page
  if (req.session.user) {
    return res.redirect("/");
  }
  
  res.sendFile("login.html", { root: "../" });
});

// Signup page
router.get("/signup", (req, res) => {
  // If user is already logged in, redirect to home page
  if (req.session.user) {
    return res.redirect("/");
  }
  
  res.sendFile("signup.html", { root: "../" });
});

// Forgot password page
router.get("/forgot-password", (req, res) => {
  res.sendFile("forgot-password.html", { root: "../" });
});

// Reset password page
router.get("/reset-password", (req, res) => {
  res.sendFile("reset-password.html", { root: "../" });
});

// Notifications page
router.get("/notifications", (req, res) => {
  res.sendFile("notifications.html", { root: "../" });
});

// Admin dashboard (temporary route without authentication for testing)
router.get("/admin-test", async (req, res) => {
  try {
    // Serve the HTML file for testing
    res.sendFile("admin.html", { root: "../" });
  } catch (err) {
    console.error(err);
    res.status(500).sendFile("error.html", { root: "../" });
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
    res.sendFile("admin.html", { root: "../" });
  } catch (err) {
    console.error(err);
    res.status(500).sendFile("error.html", { root: "../" });
  }
});

// Catch-all route to serve static HTML files (excluding API routes)
router.get("/:page", (req, res) => {
  const page = req.params.page;
  
  // Exclude API routes
  if (page === "api") {
    return res.status(404).json({ success: false, error: "API endpoint not found" });
  }
  
  const validPages = ["about", "books", "ebooks", "projects", "contact", "login", "signup", "forgot-password", "notifications"];
  
  if (validPages.includes(page)) {
    res.sendFile(page + ".html", { root: "../" });
  } else {
    res.status(404).sendFile("404.html", { root: "../" });
  }
});

module.exports = router;