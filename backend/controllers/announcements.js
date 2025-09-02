const Announcement = require("../models/Announcement");
const Notification = require("../models/Notification");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'announcements');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
}).array('attachments', 5); // Max 5 files

// @desc    Get all announcements with filtering
// @route   GET /api/announcements?active=true&page=&limit=
// @access  Public/Admin
exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  const {
    active = null,
    target = null,
    page = 1,
    limit = 10,
    sort = '-created_at'
  } = req.query;

  let query = {};

  // For public access, only show active public announcements
  if (!req.user || req.user.role !== 'admin') {
    const now = new Date();
    query = {
      is_active: true,
      start_at: { $lte: now },
      $or: [
        { end_at: null },
        { end_at: { $gte: now } }
      ],
      target: { $in: ['public'] }
    };
  } else {
    // Admin can see all announcements with filters
    if (active !== null) {
      query.is_active = active === 'true';
    }
    if (target) {
      query.target = target;
    }
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const announcements = await Announcement.find(query)
    .populate('created_by', 'name email full_name')
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  // Get total count for pagination
  const total = await Announcement.countDocuments(query);

  res.status(200).json({
    success: true,
    count: announcements.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: announcements
  });
});

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public/Admin
exports.getAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('created_by', 'name email full_name');

  if (!announcement) {
    return next(new ErrorResponse("Announcement not found", 404));
  }

  // Check if user can access this announcement
  if (!req.user || req.user.role !== 'admin') {
    const now = new Date();
    if (!announcement.is_active || 
        announcement.start_at > now || 
        (announcement.end_at && announcement.end_at < now) ||
        announcement.target !== 'public') {
      return next(new ErrorResponse("Announcement not found", 404));
    }
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
});

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  // Handle file uploads
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      const {
        title_en,
        title_ta,
        body_en,
        body_ta,
        target,
        start_at,
        end_at,
        is_active
      } = req.body;

      // Process attachments
      let attachments = [];
      if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
      }

      const announcementData = {
        title_en,
        title_ta,
        body_en,
        body_ta,
        attachments,
        target: target || 'public',
        start_at: start_at ? new Date(start_at) : new Date(),
        end_at: end_at ? new Date(end_at) : null,
        is_active: is_active !== undefined ? is_active : true,
        created_by: req.user.id
      };

      const announcement = await Announcement.create(announcementData);

      // If announcement is active and published, create notifications
      if (announcement.is_active && announcement.start_at <= new Date()) {
        await createAnnouncementNotifications(announcement);
      }

      const populatedAnnouncement = await Announcement.findById(announcement._id)
        .populate('created_by', 'name email full_name');

      res.status(201).json({
        success: true,
        message: "Announcement created successfully",
        data: populatedAnnouncement
      });
    } catch (error) {
      // Clean up uploaded files if announcement creation fails
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      next(error);
    }
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
  let announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new ErrorResponse("Announcement not found", 404));
  }

  // Handle file uploads
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      const updateData = { ...req.body };

      // Process new attachments
      if (req.files && req.files.length > 0) {
        const newAttachments = req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
        
        // Combine with existing attachments or replace
        updateData.attachments = [...(announcement.attachments || []), ...newAttachments];
      }

      // Update dates if provided
      if (updateData.start_at) {
        updateData.start_at = new Date(updateData.start_at);
      }
      if (updateData.end_at) {
        updateData.end_at = new Date(updateData.end_at);
      }

      announcement = await Announcement.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('created_by', 'name email full_name');

      // If announcement becomes active, create notifications
      if (updateData.is_active && announcement.start_at <= new Date()) {
        await createAnnouncementNotifications(announcement);
      }

      res.status(200).json({
        success: true,
        message: "Announcement updated successfully",
        data: announcement
      });
    } catch (error) {
      // Clean up uploaded files if update fails
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      next(error);
    }
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new ErrorResponse("Announcement not found", 404));
  }

  // Delete associated files
  if (announcement.attachments && announcement.attachments.length > 0) {
    announcement.attachments.forEach(attachment => {
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
    });
  }

  await Announcement.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Announcement deleted successfully",
    data: {}
  });
});

// Helper function to create notifications for announcements
async function createAnnouncementNotifications(announcement) {
  try {
    let targetUsers = [];

    // Get target users based on announcement target
    switch (announcement.target) {
      case 'admin':
        targetUsers = await User.find({ role: 'admin' });
        break;
      case 'users':
        targetUsers = await User.find({ role: 'user' });
        break;
      case 'moderators':
        targetUsers = await User.find({ role: 'moderator' });
        break;
      case 'editors':
        targetUsers = await User.find({ role: 'editor' });
        break;
      case 'public':
      default:
        // For public announcements, create admin notifications
        targetUsers = await User.find({ role: 'admin' });
        break;
    }

    // Create notifications for each target user
    const notifications = targetUsers.map(user => ({
      user_id: user._id,
      title: `New Announcement: ${announcement.title_en}`,
      body: announcement.body_en.substring(0, 200) + (announcement.body_en.length > 200 ? '...' : ''),
      link: `/admin/announcements/${announcement._id}`,
      type: 'announcement',
      metadata: {
        announcement_id: announcement._id,
        target: announcement.target
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating announcement notifications:', error);
  }
}

module.exports = {
  upload,
  getAnnouncements: exports.getAnnouncements,
  getAnnouncement: exports.getAnnouncement,
  createAnnouncement: exports.createAnnouncement,
  updateAnnouncement: exports.updateAnnouncement,
  deleteAnnouncement: exports.deleteAnnouncement
};