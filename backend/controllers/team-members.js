const TeamMember = require('../models/TeamMember');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/team_members');
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'team-member-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new ErrorResponse('Please upload an image file', 400), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// @desc    Get all team members
// @route   GET /api/team-members
// @access  Public
exports.getTeamMembers = asyncHandler(async (req, res, next) => {
    let query = {};
    
    // Filter by active status
    if (req.query.active !== undefined) {
        query.is_active = req.query.active === 'true';
    }
    
    // Search functionality
    if (req.query.q) {
        const searchRegex = new RegExp(req.query.q, 'i');
        query.$or = [
            { name_en: searchRegex },
            { name_ta: searchRegex },
            { role: searchRegex },
            { email: searchRegex }
        ];
    }
    
    // Filter by role
    if (req.query.role) {
        query.role = req.query.role;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Sort options
    let sortOptions = {};
    if (req.query.sort) {
        const sortBy = req.query.sort;
        const sortOrder = req.query.order === 'desc' ? -1 : 1;
        sortOptions[sortBy] = sortOrder;
    } else {
        // Default sort by order_num and then by name_en
        sortOptions = { order_num: 1, name_en: 1 };
    }
    
    try {
        const teamMembers = await TeamMember.find(query)
            .sort(sortOptions)
            .limit(limit)
            .skip(startIndex)
            .select('-__v');
        
        const total = await TeamMember.countDocuments(query);
        
        // Add image URLs to response
        const teamMembersWithImages = teamMembers.map(member => {
            const memberObj = member.toObject();
            memberObj.image_url = member.getImageUrl();
            return memberObj;
        });
        
        res.status(200).json({
            success: true,
            count: teamMembers.length,
            total: total,
            pagination: {
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            },
            data: teamMembersWithImages
        });
    } catch (error) {
        return next(new ErrorResponse('Server Error', 500));
    }
});

// @desc    Get single team member
// @route   GET /api/team-members/:id
// @access  Public
exports.getTeamMember = asyncHandler(async (req, res, next) => {
    const teamMember = await TeamMember.findById(req.params.id).select('-__v');
    
    if (!teamMember) {
        return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
    }
    
    const memberObj = teamMember.toObject();
    memberObj.image_url = teamMember.getImageUrl();
    
    res.status(200).json({
        success: true,
        data: memberObj
    });
});

// @desc    Create new team member
// @route   POST /api/team-members
// @access  Private/Admin
exports.createTeamMember = asyncHandler(async (req, res, next) => {
    // Handle multipart form data
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(err.message, 400));
        }
        
        try {
            const teamMemberData = { ...req.body };
            
            // Handle social_links if provided as string
            if (typeof req.body.social_links === 'string') {
                try {
                    teamMemberData.social_links = JSON.parse(req.body.social_links);
                } catch (parseError) {
                    return next(new ErrorResponse('Invalid social_links format', 400));
                }
            }
            
            // Add image path if file was uploaded
            if (req.file) {
                teamMemberData.image_path = req.file.filename;
            }
            
            const teamMember = await TeamMember.create(teamMemberData);
            
            const memberObj = teamMember.toObject();
            memberObj.image_url = teamMember.getImageUrl();
            
            res.status(201).json({
                success: true,
                data: memberObj
            });
        } catch (error) {
            // Clean up uploaded file if database save failed
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting uploaded file:', unlinkError);
                }
            }
            
            if (error.name === 'ValidationError') {
                const message = Object.values(error.errors).map(val => val.message).join(', ');
                return next(new ErrorResponse(message, 400));
            }
            
            if (error.code === 11000) {
                return next(new ErrorResponse('Duplicate field value entered', 400));
            }
            
            return next(new ErrorResponse('Server Error', 500));
        }
    });
});

// @desc    Update team member
// @route   PUT /api/team-members/:id
// @access  Private/Admin
exports.updateTeamMember = asyncHandler(async (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(err.message, 400));
        }
        
        try {
            let teamMember = await TeamMember.findById(req.params.id);
            
            if (!teamMember) {
                return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
            }
            
            const updateData = { ...req.body };
            
            // Handle social_links if provided as string
            if (typeof req.body.social_links === 'string') {
                try {
                    updateData.social_links = JSON.parse(req.body.social_links);
                } catch (parseError) {
                    return next(new ErrorResponse('Invalid social_links format', 400));
                }
            }
            
            // Handle image upload
            if (req.file) {
                // Delete old image if it exists
                if (teamMember.image_path) {
                    const oldImagePath = path.join(__dirname, '../uploads/team_members', teamMember.image_path);
                    try {
                        await fs.unlink(oldImagePath);
                    } catch (unlinkError) {
                        console.error('Error deleting old image:', unlinkError);
                    }
                }
                
                updateData.image_path = req.file.filename;
            }
            
            teamMember = await TeamMember.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );
            
            const memberObj = teamMember.toObject();
            memberObj.image_url = teamMember.getImageUrl();
            
            res.status(200).json({
                success: true,
                data: memberObj
            });
        } catch (error) {
            // Clean up uploaded file if database save failed
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting uploaded file:', unlinkError);
                }
            }
            
            if (error.name === 'ValidationError') {
                const message = Object.values(error.errors).map(val => val.message).join(', ');
                return next(new ErrorResponse(message, 400));
            }
            
            if (error.code === 11000) {
                return next(new ErrorResponse('Duplicate field value entered', 400));
            }
            
            return next(new ErrorResponse('Server Error', 500));
        }
    });
});

// @desc    Delete team member
// @route   DELETE /api/team-members/:id
// @access  Private/Admin
exports.deleteTeamMember = asyncHandler(async (req, res, next) => {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
        return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
    }
    
    // Delete associated image file
    if (teamMember.image_path) {
        const imagePath = path.join(__dirname, '../uploads/team_members', teamMember.image_path);
        try {
            await fs.unlink(imagePath);
        } catch (unlinkError) {
            console.error('Error deleting image file:', unlinkError);
        }
    }
    
    await TeamMember.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Upload team member image
// @route   POST /api/team-members/:id/image
// @access  Private/Admin
exports.uploadTeamMemberImage = asyncHandler(async (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return next(new ErrorResponse(err.message, 400));
        }
        
        if (!req.file) {
            return next(new ErrorResponse('Please upload an image file', 400));
        }
        
        try {
            let teamMember = await TeamMember.findById(req.params.id);
            
            if (!teamMember) {
                // Clean up uploaded file
                await fs.unlink(req.file.path);
                return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
            }
            
            // Delete old image if it exists
            if (teamMember.image_path) {
                const oldImagePath = path.join(__dirname, '../uploads/team_members', teamMember.image_path);
                try {
                    await fs.unlink(oldImagePath);
                } catch (unlinkError) {
                    console.error('Error deleting old image:', unlinkError);
                }
            }
            
            // Update team member with new image path
            teamMember = await TeamMember.findByIdAndUpdate(
                req.params.id,
                { image_path: req.file.filename },
                { new: true, runValidators: true }
            );
            
            const memberObj = teamMember.toObject();
            memberObj.image_url = teamMember.getImageUrl();
            
            res.status(200).json({
                success: true,
                data: memberObj
            });
        } catch (error) {
            // Clean up uploaded file if database save failed
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
            
            return next(new ErrorResponse('Server Error', 500));
        }
    });
});

// @desc    Delete team member image
// @route   DELETE /api/team-members/:id/image
// @access  Private/Admin
exports.deleteTeamMemberImage = asyncHandler(async (req, res, next) => {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
        return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
    }
    
    if (!teamMember.image_path) {
        return next(new ErrorResponse('No image to delete', 400));
    }
    
    // Delete image file
    const imagePath = path.join(__dirname, '../uploads/team_members', teamMember.image_path);
    try {
        await fs.unlink(imagePath);
    } catch (unlinkError) {
        console.error('Error deleting image file:', unlinkError);
    }
    
    // Update team member to remove image path
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
        req.params.id,
        { image_path: null },
        { new: true, runValidators: true }
    );
    
    const memberObj = updatedTeamMember.toObject();
    memberObj.image_url = updatedTeamMember.getImageUrl();
    
    res.status(200).json({
        success: true,
        data: memberObj
    });
});