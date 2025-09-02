const Initiative = require("../models/Initiative");
const InitiativeImage = require("../models/InitiativeImage");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/initiatives/');
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

// @desc    Get all initiatives
// @route   GET /api/initiatives
// @access  Public
exports.getInitiatives = async (req, res, next) => {
    try {
        let query = Initiative.find();

        // Search functionality
        if (req.query.q) {
            query = query.find({
                $text: { $search: req.query.q }
            });
        }

        // Filter by bureau
        if (req.query.bureau) {
            query = query.find({ bureau: req.query.bureau });
        }

        // Filter by status
        if (req.query.status) {
            query = query.find({ status: req.query.status });
        }

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
        const total = await Initiative.countDocuments(query.getQuery());

        query = query.skip(startIndex).limit(limit);

        // Execute query
        const initiatives = await query;

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
            count: initiatives.length,
            total,
            pagination,
            data: initiatives
        });
    } catch (error) {
        console.error("Error fetching initiatives:", error);
        next(new ErrorResponse("Error fetching initiatives", 500));
    }
};

// @desc    Get single initiative
// @route   GET /api/initiatives/:id
// @access  Public
exports.getInitiative = async (req, res, next) => {
    try {
        const initiative = await Initiative.findById(req.params.id).populate('images');

        if (!initiative) {
            return next(new ErrorResponse(`Initiative not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: initiative
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new initiative
// @route   POST /api/initiatives
// @access  Private (Admin only)
exports.createInitiative = async (req, res, next) => {
    try {
        const initiative = await Initiative.create(req.body);

        res.status(201).json({
            success: true,
            data: initiative
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update initiative
// @route   PUT /api/initiatives/:id
// @access  Private (Admin only)
exports.updateInitiative = async (req, res, next) => {
    try {
        const initiative = await Initiative.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('images');

        if (!initiative) {
            return next(new ErrorResponse(`Initiative not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: initiative
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete initiative
// @route   DELETE /api/initiatives/:id
// @access  Private (Admin only)
exports.deleteInitiative = async (req, res, next) => {
    try {
        const initiative = await Initiative.findById(req.params.id);

        if (!initiative) {
            return next(new ErrorResponse(`Initiative not found with id of ${req.params.id}`, 404));
        }

        await initiative.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get initiative bureaus
// @route   GET /api/initiatives/bureaus
// @access  Public
exports.getInitiativeBureaus = async (req, res, next) => {
    try {
        const bureaus = await Initiative.distinct("bureau");
        
        res.status(200).json({
            success: true,
            data: bureaus
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get initiative statistics
// @route   GET /api/initiatives/stats
// @access  Private (Admin only)
exports.getInitiativeStats = async (req, res, next) => {
    try {
        const statusStats = await Initiative.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const bureauStats = await Initiative.aggregate([
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

        const totalInitiatives = await Initiative.countDocuments();
        const activeInitiatives = await Initiative.countDocuments({ status: "active" });
        const draftInitiatives = await Initiative.countDocuments({ status: "draft" });
        const archivedInitiatives = await Initiative.countDocuments({ status: "archived" });

        res.status(200).json({
            success: true,
            data: {
                totalInitiatives,
                activeInitiatives,
                draftInitiatives,
                archivedInitiatives,
                statusStats,
                bureauStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload initiative images
// @route   POST /api/initiatives/:id/images
// @access  Private (Admin only)
exports.uploadInitiativeImages = [upload.array('images', 10), async (req, res, next) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        
        if (!initiative) {
            return next(new ErrorResponse(`Initiative not found with id of ${req.params.id}`, 404));
        }
        
        if (!req.files || req.files.length === 0) {
            return next(new ErrorResponse("Please upload at least one image file", 400));
        }
        
        // Create upload directory if it doesn't exist
        const uploadDir = path.join(__dirname, "../uploads/initiatives");
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            console.log("Directory already exists or error creating:", err.message);
        }
        
        const uploadedImages = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imageUrl = `/uploads/initiatives/${file.filename}`;
            
            // Create InitiativeImage record
            const initiativeImage = await InitiativeImage.create({
                initiative_id: initiative._id,
                file_path: imageUrl,
                is_primary: i === 0 && initiative.images_count === 0, // First image is primary if no images exist
                sort_order: initiative.images_count + i + 1
            });
            
            uploadedImages.push(initiativeImage);
        }
        
        // Update initiative images count
        initiative.images_count += req.files.length;
        
        // Set primary image URL if this is the first image
        if (!initiative.primary_image_url && uploadedImages.length > 0) {
            initiative.primary_image_url = uploadedImages[0].file_path;
        }
        
        await initiative.save();
        
        res.status(200).json({
            success: true,
            data: {
                initiative,
                uploadedImages
            },
            message: "Initiative images uploaded successfully"
        });
    } catch (error) {
        next(error);
    }
}];

// @desc    Delete initiative image
// @route   DELETE /api/initiatives/:id/images/:imageId
// @access  Private (Admin only)
exports.deleteInitiativeImage = async (req, res, next) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        
        if (!initiative) {
            return next(new ErrorResponse(`Initiative not found with id of ${req.params.id}`, 404));
        }
        
        const initiativeImage = await InitiativeImage.findById(req.params.imageId);
        
        if (!initiativeImage) {
            return next(new ErrorResponse(`Image not found with id of ${req.params.imageId}`, 404));
        }
        
        // Delete the file from filesystem
        const filePath = path.join(__dirname, '..', initiativeImage.file_path);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.log('File not found or already deleted:', err.message);
        }
        
        // If this was the primary image, set another image as primary
        if (initiativeImage.is_primary) {
            const nextImage = await InitiativeImage.findOne({
                initiative_id: initiative._id,
                _id: { $ne: initiativeImage._id }
            }).sort({ sort_order: 1 });
            
            if (nextImage) {
                nextImage.is_primary = true;
                await nextImage.save();
                initiative.primary_image_url = nextImage.file_path;
            } else {
                initiative.primary_image_url = null;
            }
        }
        
        // Delete the image record
        await InitiativeImage.findByIdAndDelete(req.params.imageId);
        
        // Update initiative images count
        initiative.images_count = Math.max(0, initiative.images_count - 1);
        await initiative.save();
        
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Set primary initiative image
// @route   PUT /api/initiatives/:id/images/:imageId/primary
// @access  Private (Admin only)
exports.setPrimaryImage = async (req, res, next) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        
        if (!initiative) {
            return next(new ErrorResponse(`Initiative not found with id of ${req.params.id}`, 404));
        }
        
        // Remove primary status from all images
        await InitiativeImage.updateMany(
            { initiative_id: initiative._id },
            { is_primary: false }
        );
        
        // Set new primary image
        const newPrimaryImage = await InitiativeImage.findByIdAndUpdate(
            req.params.imageId,
            { is_primary: true },
            { new: true }
        );
        
        if (!newPrimaryImage) {
            return next(new ErrorResponse(`Image not found with id of ${req.params.imageId}`, 404));
        }
        
        // Update initiative primary image URL
        initiative.primary_image_url = newPrimaryImage.file_path;
        await initiative.save();
        
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