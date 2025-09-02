const User = require("../models/User");
const Book = require("../models/Book");
const Ebook = require("../models/Ebook");
const Project = require("../models/Project");
const Activity = require("../models/Activity");
const Initiative = require("../models/Initiative");
const WebsiteContent = require("../models/WebsiteContent");
const ActivityLog = require("../models/ActivityLog");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardData = async (req, res, next) => {
  try {
    // Get actual counts from database
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalEbooks = await Ebook.countDocuments();
    const totalProjects = await Project.countDocuments();

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3);
    // Note: Mock database doesn't support .select() method

    // Get recent books
    const recentBooks = await Book.find()
      .sort({ createdAt: -1 })
      .limit(3);
    // Note: Mock database doesn't support .select() method

    // Get recent ebooks
    const recentEbooks = await Ebook.find()
      .sort({ createdAt: -1 })
      .limit(2);
    // Note: Mock database doesn't support .select() method

    // Get recent projects
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(2);
    // Note: Mock database doesn't support .select() method



    // Combine all activities
    const recentActivity = [];

    // Add user activities
    recentUsers.forEach(user => {
      recentActivity.push({
        type: "user",
        title: `New user registered: ${user.name}`,
        description: user.email,
        time: user.createdAt,
        icon: "fas fa-user-plus"
      });
    });

    // Add book activities
    recentBooks.forEach(book => {
      recentActivity.push({
        type: "book",
        title: `New book added: ${book.title}`,
        description: `by ${book.author}`,
        time: book.createdAt,
        icon: "fas fa-book"
      });
    });

    // Add ebook activities
    recentEbooks.forEach(ebook => {
      recentActivity.push({
        type: "ebook",
        title: `New e-book added: ${ebook.title}`,
        description: `by ${ebook.author}`,
        time: ebook.createdAt,
        icon: "fas fa-tablet-alt"
      });
    });

    // Add project activities
    recentProjects.forEach(project => {
      recentActivity.push({
        type: "project",
        title: `New project created: ${project.title}`,
        description: project.description ? project.description.substring(0, 50) + "..." : "",
        time: project.createdAt,
        icon: "fas fa-project-diagram"
      });
    });



    // Sort by time and limit to 10 most recent
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivity = recentActivity.slice(0, 10);

    const dashboardData = {
      totalUsers,
      totalBooks,
      totalEbooks,
      totalProjects,
      recentActivity: limitedActivity,
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        joinedDate: user.createdAt
      })),
      recentBooks: recentBooks.map(book => ({
        id: book._id,
        title: book.title,
        author: book.author,
        addedDate: book.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Auto-clear recent activities older than 1 month
// @route   DELETE /api/admin/activities/auto-clear
// @access  Private (Admin only)
exports.autoClearRecentActivities = async (req, res, next) => {
  try {
    // Calculate date 1 month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Delete activity logs older than 1 month
    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: oneMonthAgo }
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} old activities`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate: oneMonthAgo
      }
    });
  } catch (error) {
    console.error("Error auto-clearing activities:", error);
    next(new ErrorResponse("Error clearing old activities", 500));
  }
};

// @desc    Get recent activities from activity log
// @route   GET /api/admin/activities/recent
// @access  Private (Admin only)
exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent activity logs
    const recentActivities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('adminId', 'name email');

    // Format activities for dashboard display
    const formattedActivities = recentActivities.map(activity => ({
      type: activity.targetType,
      action: activity.action,
      title: activity.description,
      time: activity.createdAt,
      admin: activity.adminName,
      page: activity.page,
      icon: getActivityIcon(activity.action, activity.targetType),
      color: getActivityColor(activity.action)
    }));

    res.status(200).json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    next(new ErrorResponse("Error fetching recent activities", 500));
  }
};

// Helper function to get activity icon
function getActivityIcon(action, targetType) {
  const iconMap = {
    create: "fas fa-plus",
    edit: "fas fa-edit",
    delete: "fas fa-trash",
    duplicate: "fas fa-copy",
    reorder: "fas fa-sort",
    publish: "fas fa-eye",
    unpublish: "fas fa-eye-slash",
    view: "fas fa-eye"
  };
  
  const typeIconMap = {
    content: "fas fa-file-alt",
    section: "fas fa-layer-group",
    page: "fas fa-file",
    media: "fas fa-image"
  };
  
  return iconMap[action] || typeIconMap[targetType] || "fas fa-info-circle";
}

// Helper function to get activity color
function getActivityColor(action) {
  const colorMap = {
    create: "#10b981",
    edit: "#3b82f6",
    delete: "#ef4444",
    duplicate: "#8b5cf6",
    reorder: "#f59e0b",
    publish: "#10b981",
    unpublish: "#6b7280",
    view: "#3b82f6"
  };
  
  return colorMap[action] || "#6b7280";
}

// @desc    Get website content
// @route   GET /api/admin/content
// @access  Private/Admin
exports.getContent = async (req, res, next) => {
  try {
    // Get all website content from database
    const allContent = await WebsiteContent.find({ isActive: true })
      .sort({ page: 1, order: 1 });

    // Organize content by page and section
    const contentData = {};
    
    allContent.forEach(item => {
      if (!contentData[item.page]) {
        contentData[item.page] = {};
      }
      
      contentData[item.page][item.section] = {
        id: item._id,
        title: item.title,
        titleTamil: item.titleTamil,
        content: item.content,
        contentTamil: item.contentTamil,
        subtitle: item.subtitle,
        subtitleTamil: item.subtitleTamil,
        buttonText: item.buttonText,
        buttonTextTamil: item.buttonTextTamil,
        buttonUrl: item.buttonUrl,
        image: item.image,
        images: item.images,
        metadata: item.metadata,
        order: item.order,
        isVisible: item.isVisible
      };
    });

    // If no content exists, create default structure
    if (Object.keys(contentData).length === 0) {
      contentData.home = {
        hero: {
          title: "Welcome to Tamil Language Society",
          subtitle: "Preserving and promoting Tamil literature and culture",
          buttonText: "Explore Books",
          buttonUrl: "/books.html"
        }
      };
    }

    res.status(200).json({
      success: true,
      data: contentData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update website content
// @route   PUT /api/admin/content
// @access  Private/Admin
exports.updateContent = async (req, res, next) => {
  try {
    const { page, section, ...contentData } = req.body;
    
    if (!page || !section) {
      return res.status(400).json({
        success: false,
        message: "Page and section are required"
      });
    }

    // Find existing content or create new
    let content = await WebsiteContent.findOne({ page, section });
    
    if (content) {
      // Update existing content
      Object.assign(content, contentData);
      content.updatedBy = req.user?.id;
      await content.save();
    } else {
      // Create new content
      content = await WebsiteContent.create({
        page,
        section,
        ...contentData,
        createdBy: req.user?.id || "000000000000000000000000" // Default user ID if not authenticated
      });
    }

    res.status(200).json({
      success: true,
      message: "Content updated successfully",
      data: content
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get messages/contacts
// @route   GET /api/admin/messages
// @access  Private/Admin
exports.getMessages = async (req, res, next) => {
  try {
    // Get messages from database
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 });
    // Note: Mock database doesn't support .select() method

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      date: msg.createdAt,
      read: msg.isRead || false
    }));

    res.status(200).json({
      success: true,
      count: formattedMessages.length,
      data: formattedMessages
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res, next) => {
  try {
    // Get settings from WebsiteContent with page 'settings'
    const settingsContent = await WebsiteContent.find({ page: "settings", isActive: true });
    
    const settings = {};
    
    settingsContent.forEach(item => {
      if (!settings[item.section]) {
        settings[item.section] = {};
      }
      
      // Store all relevant fields
      if (item.title) settings[item.section].siteName = item.title;
      if (item.content) settings[item.section].siteDescription = item.content;
      if (item.metadata) {
        Object.assign(settings[item.section], item.metadata);
      }
    });

    // Provide default settings if none exist
    if (Object.keys(settings).length === 0) {
      settings.general = {
        siteName: "Tamil Language Society",
        siteDescription: "Preserving and promoting Tamil literature and culture",
        contactEmail: "contact@tamilsociety.org",
        phoneNumber: "+91 1234567890"
      };
      settings.social = {
        facebook: "https://facebook.com/tamilsociety",
        twitter: "https://twitter.com/tamilsociety",
        instagram: "https://instagram.com/tamilsociety"
      };
      settings.notifications = {
        enableEmailNotifications: true,
        enablePushNotifications: false
      };
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const settingsData = req.body;
    
    // Save each settings section to the database
    for (const [section, data] of Object.entries(settingsData)) {
      let content = await WebsiteContent.findOne({ page: "settings", section });
      
      if (content) {
        // Update existing settings
        content.title = data.siteName || content.title;
        content.content = data.siteDescription || content.content;
        content.metadata = { ...content.metadata, ...data };
        content.updatedBy = req.user?.id;
        await content.save();
      } else {
        // Create new settings
        await WebsiteContent.create({
          page: "settings",
          section,
          title: data.siteName,
          content: data.siteDescription,
          metadata: data,
          createdBy: req.user?.id || "000000000000000000000000"
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settingsData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all activities for admin
// @route   GET /api/admin/activities
// @access  Private/Admin
exports.getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all initiatives for admin
// @route   GET /api/admin/initiatives
// @access  Private/Admin
exports.getInitiatives = async (req, res, next) => {
  try {
    const initiatives = await Initiative.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: initiatives.length,
      data: initiatives
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single activity for admin
// @route   GET /api/admin/activities/:id
// @access  Private/Admin
exports.getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activity not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single initiative for admin
// @route   GET /api/admin/initiatives/:id
// @access  Private/Admin
exports.getInitiative = async (req, res, next) => {
  try {
    const initiative = await Initiative.findById(req.params.id);
    
    if (!initiative) {
      return res.status(404).json({
        success: false,
        error: "Initiative not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: initiative
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update activity
// @route   PUT /api/admin/activities/:id
// @access  Private/Admin
exports.updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activity not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update initiative
// @route   PUT /api/admin/initiatives/:id
// @access  Private/Admin
exports.updateInitiative = async (req, res, next) => {
  try {
    const initiative = await Initiative.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!initiative) {
      return res.status(404).json({
        success: false,
        error: "Initiative not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: initiative
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete activity
// @route   DELETE /api/admin/activities/:id
// @access  Private/Admin
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activity not found"
      });
    }
    
    await activity.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete initiative
// @route   DELETE /api/admin/initiatives/:id
// @access  Private/Admin
exports.deleteInitiative = async (req, res, next) => {
  try {
    const initiative = await Initiative.findById(req.params.id);
    
    if (!initiative) {
      return res.status(404).json({
        success: false,
        error: "Initiative not found"
      });
    }
    
    await initiative.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};