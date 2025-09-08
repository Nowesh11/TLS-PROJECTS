const Activity = require("../models/Activity");
const ActivityImage = require("../models/ActivityImage");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/activities/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// @desc    Get all activities
// @route   GET /api/activities
// @access  Public
exports.getActivities = async (req, res, next) => {
    try {
        let queryObj = {};

        // Search functionality
        if (req.query.q) {
            queryObj.$text = { $search: req.query.q };
        }

        // Filter by bureau
        if (req.query.bureau) {
            queryObj.bureau = req.query.bureau;
        }

        // Filter by status
        if (req.query.status) {
            queryObj.status = req.query.status;
        }

        let query = Activity.find(queryObj);

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Activity.countDocuments(queryObj);

        query = query.skip(startIndex).limit(limit);

        // Execute query
        const activities = await query;

        // Language filtering
        let processedActivities = activities;
        if (req.query.lang && (req.query.lang === 'en' || req.query.lang === 'ta')) {
            processedActivities = activities.map(activity => {
                const activityObj = activity.toObject();
                
                // Transform bilingual fields to single language
                if (activityObj.title && typeof activityObj.title === 'object') {
                    activityObj.title = activityObj.title[req.query.lang] || activityObj.title.en;
                }
                if (activityObj.description && typeof activityObj.description === 'object') {
                    activityObj.description = activityObj.description[req.query.lang] || activityObj.description.en;
                }
                
                return activityObj;
            });
        }

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: processedActivities.length,
            total,
            pagination,
            data: processedActivities
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        next(new ErrorResponse("Error fetching activities", 500));
    }
};

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Public
exports.getActivity = async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id).populate('images');

        if (!activity) {
            return next(new ErrorResponse(`Activity not found with id of ${req.params.id}`, 404));
        }

        // Language filtering
        let processedActivity = activity;
        if (req.query.lang && (req.query.lang === 'en' || req.query.lang === 'ta')) {
            const activityObj = activity.toObject();
            
            // Transform bilingual fields to single language
            if (activityObj.title && typeof activityObj.title === 'object') {
                activityObj.title = activityObj.title[req.query.lang] || activityObj.title.en;
            }
            if (activityObj.description && typeof activityObj.description === 'object') {
                activityObj.description = activityObj.description[req.query.lang] || activityObj.description.en;
            }
            if (activityObj.goals && typeof activityObj.goals === 'object') {
                activityObj.goals = activityObj.goals[req.query.lang] || activityObj.goals.en;
            }
            if (activityObj.director && typeof activityObj.director === 'object') {
                activityObj.director = activityObj.director[req.query.lang] || activityObj.director.en;
            }
            
            processedActivity = activityObj;
        }

        res.status(200).json({
            success: true,
            data: processedActivity
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private (Admin only)
exports.createActivity = async (req, res, next) => {
    try {
        const activity = await Activity.create(req.body);

        res.status(201).json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private (Admin only)
exports.updateActivity = async (req, res, next) => {
    try {
        const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('images');

        if (!activity) {
            return next(new ErrorResponse(`Activity not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Admin only)
exports.deleteActivity = async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return next(new ErrorResponse(`Activity not found with id of ${req.params.id}`, 404));
        }

        await activity.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activity bureaus
// @route   GET /api/activities/bureaus
// @access  Public
exports.getActivityBureaus = async (req, res, next) => {
    try {
        const bureaus = await Activity.distinct("bureau");
        
        res.status(200).json({
            success: true,
            data: bureaus
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activity statistics
// @route   GET /api/activities/stats
// @access  Private (Admin only)
exports.getActivityStats = async (req, res, next) => {
    try {
        const statusStats = await Activity.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const bureauStats = await Activity.aggregate([
            {
                $group: {
                    _id: "$bureau",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalActivities = await Activity.countDocuments();
        const activeActivities = await Activity.countDocuments({ status: "active" });
        const draftActivities = await Activity.countDocuments({ status: "draft" });
        const archivedActivities = await Activity.countDocuments({ status: "archived" });

        res.status(200).json({
            success: true,
            data: {
                totalActivities,
                activeActivities,
                draftActivities,
                archivedActivities,
                statusStats,
                bureauStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload activity images
// @route   POST /api/activities/:id/images
// @access  Private (Admin only)
exports.uploadActivityImages = [upload.array('images', 10), async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id);
        
        if (!activity) {
            return next(new ErrorResponse(`Activity not found with id of ${req.params.id}`, 404));
        }
        
        if (!req.files || req.files.length === 0) {
            return next(new ErrorResponse("Please upload at least one image file", 400));
        }
        
        // Create upload directory if it doesn't exist
        const uploadDir = path.join(__dirname, "../uploads/activities");
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            console.log("Directory already exists or error creating:", err.message);
        }
        
        const uploadedImages = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imageUrl = `/uploads/activities/${file.filename}`;
            
            // Create ActivityImage record
            const activityImage = await ActivityImage.create({
                activity_id: activity._id,
                file_path: imageUrl,
                is_primary: i === 0 && activity.images_count === 0, // First image is primary if no images exist
                sort_order: activity.images_count + i + 1
            });
            
            uploadedImages.push(activityImage);
        }
        
        // Update activity images count
        activity.images_count += req.files.length;
        
        // Set primary image URL if this is the first image
        if (!activity.primary_image_url && uploadedImages.length > 0) {
            activity.primary_image_url = uploadedImages[0].file_path;
        }
        
        await activity.save();
        
        res.status(200).json({
            success: true,
            data: {
                activity,
                uploadedImages
            },
            message: "Activity images uploaded successfully"
        });
    } catch (error) {
        next(error);
    }
}];

// @desc    Delete activity image
// @route   DELETE /api/activities/:id/images/:imageId
// @access  Private (Admin only)
exports.deleteActivityImage = async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id);
        
        if (!activity) {
            return next(new ErrorResponse(`Activity not found with id of ${req.params.id}`, 404));
        }
        
        const activityImage = await ActivityImage.findById(req.params.imageId);
        
        if (!activityImage) {
            return next(new ErrorResponse(`Image not found with id of ${req.params.imageId}`, 404));
        }
        
        // Delete the file from filesystem
        const filePath = path.join(__dirname, '..', activityImage.file_path);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.log('File not found or already deleted:', err.message);
        }
        
        // If this was the primary image, set another image as primary
        if (activityImage.is_primary) {
            const nextImage = await ActivityImage.findOne({
                activity_id: activity._id,
                _id: { $ne: activityImage._id }
            }).sort({ sort_order: 1 });
            
            if (nextImage) {
                nextImage.is_primary = true;
                await nextImage.save();
                activity.primary_image_url = nextImage.file_path;
            } else {
                activity.primary_image_url = null;
            }
        }
        
        // Delete the image record
        await ActivityImage.findByIdAndDelete(req.params.imageId);
        
        // Update activity images count
        activity.images_count = Math.max(0, activity.images_count - 1);
        await activity.save();
        
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Set primary activity image
// @route   PUT /api/activities/:id/images/:imageId/primary
// @access  Private (Admin only)
exports.setPrimaryImage = async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id);
        
        if (!activity) {
            return next(new ErrorResponse(`Activity not found with id of ${req.params.id}`, 404));
        }
        
        // Remove primary status from all images
        await ActivityImage.updateMany(
            { activity_id: activity._id },
            { is_primary: false }
        );
        
        // Set new primary image
        const newPrimaryImage = await ActivityImage.findByIdAndUpdate(
            req.params.imageId,
            { is_primary: true },
            { new: true }
        );
        
        if (!newPrimaryImage) {
            return next(new ErrorResponse(`Image not found with id of ${req.params.imageId}`, 404));
        }
        
        // Update activity primary image URL
        activity.primary_image_url = newPrimaryImage.file_path;
        await activity.save();
        
        res.status(200).json({
            success: true,
            data: newPrimaryImage,
            message: 'Primary image updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Export upload middleware
exports.upload = upload;