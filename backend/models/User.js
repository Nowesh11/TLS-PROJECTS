const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, "Please add a full name"],
    trim: true,
    maxlength: [100, "Full name cannot be more than 100 characters"]
  },
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email"
    ]
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [30, "Username cannot be more than 30 characters"]
  },
  password: {
    type: String,
    required: function() {
      // Password not required for Google OAuth users
      return !this.googleId;
    },
    minlength: [6, "Password must be at least 6 characters"]
    // Note: Removed 'select: false' for mock database compatibility
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [30, "First name cannot be more than 30 characters"]
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [30, "Last name cannot be more than 30 characters"]
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  profilePicture: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ["user", "admin", "moderator", "editor"],
    default: "user"
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please add a valid phone number"]
  },
  is_active: {
    type: Boolean,
    default: true
  },
  registered_at: {
    type: Date,
    default: Date.now
  },
  last_login_at: {
    type: Date,
    default: null
  },
  profile_image_path: {
    type: String,
    default: null
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  primaryInterest: {
    type: String,
    enum: ["Books", "Events", "Community", "Culture", "History", "Language", "Other"],
    default: "Books"
  },
  preferences: {
    receiveNewsletter: {
      type: Boolean,
      default: false
    },
    receiveNotifications: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system"
    },
    language: {
      type: String,
      enum: ["english", "tamil"],
      default: "english"
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: {
      type: Date,
      default: null
    },
    lockedUntil: {
      type: Date,
      default: null
    }
  }
});

// Encrypt password using bcrypt
// Note: Pre-save middleware removed for mock database compatibility
// Password hashing and admin role assignment would need to be handled manually in controllers

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken;
};

// Record failed login attempt
UserSchema.methods.recordFailedLoginAttempt = function() {
  this.loginAttempts.count += 1;
  this.loginAttempts.lastAttempt = Date.now();
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts.count >= 5) {
    // Lock for 30 minutes
    this.loginAttempts.lockedUntil = Date.now() + 30 * 60 * 1000;
  }
  
  return this.save();
};

// Clear login attempts
UserSchema.methods.clearLoginAttempts = function() {
  this.loginAttempts.count = 0;
  this.loginAttempts.lockedUntil = null;
  this.lastLogin = Date.now();
  
  return this.save();
};

// Check if account is locked
UserSchema.methods.isAccountLocked = function() {
  if (!this.loginAttempts.lockedUntil) {
    return false;
  }
  
  return this.loginAttempts.lockedUntil > Date.now();
};

module.exports = mongoose.model("User", UserSchema);