const Project = require("../models/Project");
const ProjectImage = require("../models/ProjectImage");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/projects/');
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

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res, next) => {
    try {
        // Build query object
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

        // Create query with filters
        let query = Project.find(queryObj);

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
        const total = await Project.countDocuments(queryObj);

        query = query.skip(startIndex).limit(limit);

        const projects = await query;

        // Language filtering
        let processedProjects = projects;
        if (req.query.lang && (req.query.lang === 'en' || req.query.lang === 'ta')) {
            processedProjects = projects.map(project => {
                const projectObj = project.toObject();
                
                // Transform bilingual fields to single language
                if (projectObj.title && typeof projectObj.title === 'object') {
                    projectObj.title = projectObj.title[req.query.lang] || projectObj.title.en;
                }
                if (projectObj.description && typeof projectObj.description === 'object') {
                    projectObj.description = projectObj.description[req.query.lang] || projectObj.description.en;
                }
                if (projectObj.goals && typeof projectObj.goals === 'object') {
                    projectObj.goals = projectObj.goals[req.query.lang] || projectObj.goals.en;
                }
                if (projectObj.director && typeof projectObj.director === 'object') {
                    projectObj.director = projectObj.director[req.query.lang] || projectObj.director.en;
                }
                
                return projectObj;
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
            count: processedProjects.length,
            total,
            pagination,
            data: processedProjects
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).populate('images');

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        // Language filtering
        let processedProject = project;
        if (req.query.lang && (req.query.lang === 'en' || req.query.lang === 'ta')) {
            const projectObj = project.toObject();
            
            // Transform bilingual fields to single language
            if (projectObj.title && typeof projectObj.title === 'object') {
                projectObj.title = projectObj.title[req.query.lang] || projectObj.title.en;
            }
            if (projectObj.description && typeof projectObj.description === 'object') {
                projectObj.description = projectObj.description[req.query.lang] || projectObj.description.en;
            }
            if (projectObj.goals && typeof projectObj.goals === 'object') {
                projectObj.goals = projectObj.goals[req.query.lang] || projectObj.goals.en;
            }
            if (projectObj.director && typeof projectObj.director === 'object') {
                projectObj.director = projectObj.director[req.query.lang] || projectObj.director.en;
            }
            
            processedProject = projectObj;
        }

        res.status(200).json({
            success: true,
            data: processedProject
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin only)
exports.createProject = async (req, res, next) => {
    try {
        const project = await Project.create(req.body);

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
exports.updateProject = async (req, res, next) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('images');

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get project bureaus
// @route   GET /api/projects/bureaus
// @access  Public
exports.getProjectBureaus = async (req, res, next) => {
    try {
        const bureaus = await Project.distinct("bureau");
        
        res.status(200).json({
            success: true,
            data: bureaus
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private (Admin only)
exports.getProjectStats = async (req, res, next) => {
    try {
        const statusStats = await Project.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const bureauStats = await Project.aggregate([
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

        const totalProjects = await Project.countDocuments();
        const activeProjects = await Project.countDocuments({ status: "active" });
        const draftProjects = await Project.countDocuments({ status: "draft" });
        const archivedProjects = await Project.countDocuments({ status: "archived" });

        res.status(200).json({
            success: true,
            data: {
                totalProjects,
                activeProjects,
                draftProjects,
                archivedProjects,
                statusStats,
                bureauStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload project images
// @route   POST /api/projects/:id/images
// @access  Private (Admin only)
exports.uploadProjectImages = [upload.array('images', 10), async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }
        
        if (!req.files || req.files.length === 0) {
            return next(new ErrorResponse("Please upload at least one image file", 400));
        }
        
        // Create upload directory if it doesn't exist
        const uploadDir = path.join(__dirname, "../uploads/projects");
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            console.log("Directory already exists or error creating:", err.message);
        }
        
        const uploadedImages = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imageUrl = `/uploads/projects/${file.filename}`;
            
            // Create ProjectImage record
            const projectImage = await ProjectImage.create({
                project_id: project._id,
                file_path: imageUrl,
                is_primary: i === 0 && project.images_count === 0, // First image is primary if no images exist
                sort_order: project.images_count + i + 1
            });
            
            uploadedImages.push(projectImage);
        }
        
        // Update project images count
        project.images_count += req.files.length;
        
        // Set primary image URL if this is the first image
        if (!project.primary_image_url && uploadedImages.length > 0) {
            project.primary_image_url = uploadedImages[0].file_path;
        }
        
        await project.save();
        
        res.status(200).json({
            success: true,
            data: {
                project,
                uploadedImages
            },
            message: "Project images uploaded successfully"
        });
    } catch (error) {
        next(error);
    }
}];

// @desc    Delete project image
// @route   DELETE /api/projects/:id/images/:imageId
// @access  Private (Admin only)
exports.deleteProjectImage = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }
        
        const projectImage = await ProjectImage.findById(req.params.imageId);
        
        if (!projectImage) {
            return next(new ErrorResponse(`Image not found with id of ${req.params.imageId}`, 404));
        }
        
        // Delete the file from filesystem
        const filePath = path.join(__dirname, '..', projectImage.file_path);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.log('File not found or already deleted:', err.message);
        }
        
        // If this was the primary image, set another image as primary
        if (projectImage.is_primary) {
            const nextImage = await ProjectImage.findOne({
                project_id: project._id,
                _id: { $ne: projectImage._id }
            }).sort({ sort_order: 1 });
            
            if (nextImage) {
                nextImage.is_primary = true;
                await nextImage.save();
                project.primary_image_url = nextImage.file_path;
            } else {
                project.primary_image_url = null;
            }
        }
        
        // Delete the image record
        await ProjectImage.findByIdAndDelete(req.params.imageId);
        
        // Update project images count
        project.images_count = Math.max(0, project.images_count - 1);
        await project.save();
        
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Set primary project image
// @route   PUT /api/projects/:id/images/:imageId/primary
// @access  Private (Admin only)
exports.setPrimaryImage = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
        }
        
        // Remove primary status from all images
        await ProjectImage.updateMany(
            { project_id: project._id },
            { is_primary: false }
        );
        
        // Set new primary image
        const newPrimaryImage = await ProjectImage.findByIdAndUpdate(
            req.params.imageId,
            { is_primary: true },
            { new: true }
        );
        
        if (!newPrimaryImage) {
            return next(new ErrorResponse(`Image not found with id of ${req.params.imageId}`, 404));
        }
        
        // Update project primary image URL
        project.primary_image_url = newPrimaryImage.file_path;
        await project.save();
        
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