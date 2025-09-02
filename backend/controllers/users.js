const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// @desc    Get all users with search, filter, pagination
// @route   GET /api/users?q=&role=&is_active=&page=&limit=
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const {
      q = '',
      role = '',
      is_active = '',
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Build query
    let query = {};

    // Search by name or email
    if (q) {
      query.$or = [
        { full_name: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (is_active !== '') {
      query.is_active = is_active === 'true';
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const users = await User.find(query)
      .select('-password -refreshToken -resetPasswordToken')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Delete profile image if exists
    if (user.profile_image_path) {
      const imagePath = path.join(__dirname, '..', 'uploads', 'users', user.profile_image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk operations on users
// @route   POST /api/users/bulk
// @access  Private/Admin
exports.bulkOperations = async (req, res, next) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: "Action and userIds array are required"
      });
    }

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { is_active: true }
        );
        message = `${result.modifiedCount} users activated`;
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { is_active: false }
        );
        message = `${result.modifiedCount} users deactivated`;
        break;

      case 'delete':
        // Get users to delete their profile images
        const usersToDelete = await User.find({ _id: { $in: userIds } });
        
        // Delete profile images
        usersToDelete.forEach(user => {
          if (user.profile_image_path) {
            const imagePath = path.join(__dirname, '..', 'uploads', 'users', user.profile_image_path);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }
        });

        result = await User.deleteMany({ _id: { $in: userIds } });
        message = `${result.deletedCount} users deleted`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action. Use 'activate', 'deactivate', or 'delete'"
        });
    }

    res.status(200).json({
      success: true,
      message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    user.is_active = !user.is_active;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (err) {
    next(err);
  }
};