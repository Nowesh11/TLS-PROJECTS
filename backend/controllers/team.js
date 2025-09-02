const Team = require("../models/Team");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
exports.getTeamMembers = asyncHandler(async (req, res, next) => {
    const { position, status } = req.query;
    
    let query = {};
    
    if (position) {
        query.position = position;
    }
    
    if (status) {
        query.status = status;
    } else {
        query.status = "active"; // Default to active members for public view
    }
    
    const hierarchyOrder = Team.getHierarchyOrder();
    
    const teamMembers = await Team.find(query)
        .sort([
            ["position", 1],
            ["order", 1],
            ["name", 1]
        ]);
    
    // Sort by hierarchy
    teamMembers.sort((a, b) => {
        const orderA = hierarchyOrder[a.position] || 999;
        const orderB = hierarchyOrder[b.position] || 999;
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        
        return a.order - b.order;
    });
    
    res.status(200).json({
        success: true,
        count: teamMembers.length,
        data: teamMembers
    });
});

// @desc    Get single team member
// @route   GET /api/team/:id
// @route   GET /api/team/slug/:slug
// @access  Public
exports.getTeamMember = asyncHandler(async (req, res, next) => {
    let teamMember;
    
    // Check if we're searching by slug or ID
    if (req.params.slug) {
        teamMember = await Team.findOne({ slug: req.params.slug });
        if (!teamMember) {
            return next(new ErrorResponse(`Team member not found with slug of ${req.params.slug}`, 404));
        }
    } else {
        teamMember = await Team.findById(req.params.id);
        if (!teamMember) {
            return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
        }
    }
    
    res.status(200).json({
        success: true,
        data: teamMember
    });
});

// @desc    Create new team member
// @route   POST /api/team
// @access  Private (Admin only)
exports.createTeamMember = asyncHandler(async (req, res, next) => {
    let teamData = { ...req.body };
    
    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
        const file = req.files.profilePicture;
        
        // Make sure the image is a photo
        if (!file.mimetype.startsWith("image")) {
            return next(new ErrorResponse("Please upload an image file", 400));
        }
        
        // Check filesize (5MB limit)
        if (file.size > 5000000) {
            return next(new ErrorResponse("Please upload an image less than 5MB", 400));
        }
        
        // Create custom filename
        const fileName = `team_${Date.now()}${path.parse(file.name).ext}`;
        const uploadPath = `${process.env.FILE_UPLOAD_PATH}/team/${fileName}`;
        
        try {
            await file.mv(uploadPath);
            teamData.profilePicture = `/uploads/team/${fileName}`;
            teamData.photo = `/uploads/team/${fileName}`;
        } catch (err) {
            console.error(err);
            return next(new ErrorResponse("Problem with file upload", 500));
        }
    }
    
    const teamMember = await Team.create(teamData);
    
    res.status(201).json({
        success: true,
        data: teamMember
    });
});

// @desc    Update team member
// @route   PUT /api/team/:id
// @access  Private (Admin only)
exports.updateTeamMember = asyncHandler(async (req, res, next) => {
    let teamMember = await Team.findById(req.params.id);
    
    if (!teamMember) {
        return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
    }
    
    let updateData = { ...req.body };
    
    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
        const file = req.files.profilePicture;
        
        // Make sure the image is a photo
        if (!file.mimetype.startsWith("image")) {
            return next(new ErrorResponse("Please upload an image file", 400));
        }
        
        // Check filesize (5MB limit)
        if (file.size > 5000000) {
            return next(new ErrorResponse("Please upload an image less than 5MB", 400));
        }
        
        // Create custom filename
        const fileName = `team_${teamMember._id}_${Date.now()}${path.parse(file.name).ext}`;
        const uploadPath = `${process.env.FILE_UPLOAD_PATH}/team/${fileName}`;
        
        try {
            await file.mv(uploadPath);
            updateData.profilePicture = `/uploads/team/${fileName}`;
            updateData.photo = `/uploads/team/${fileName}`;
        } catch (err) {
            console.error(err);
            return next(new ErrorResponse("Problem with file upload", 500));
        }
    }
    
    teamMember = await Team.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        data: teamMember
    });
});

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Private (Admin only)
exports.deleteTeamMember = asyncHandler(async (req, res, next) => {
    const teamMember = await Team.findById(req.params.id);
    
    if (!teamMember) {
        return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
    }
    
    await teamMember.deleteOne();
    
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Upload photo for team member
// @route   PUT /api/team/:id/photo
// @access  Private (Admin only)
exports.teamPhotoUpload = asyncHandler(async (req, res, next) => {
    const teamMember = await Team.findById(req.params.id);
    
    if (!teamMember) {
        return next(new ErrorResponse(`Team member not found with id of ${req.params.id}`, 404));
    }
    
    if (!req.files) {
        return next(new ErrorResponse("Please upload a file", 400));
    }
    
    const file = req.files.file;
    
    // Make sure the image is a photo
    if (!file.mimetype.startsWith("image")) {
        return next(new ErrorResponse("Please upload an image file", 400));
    }
    
    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }
    
    // Create custom filename
    file.name = `team_${teamMember._id}${path.parse(file.name).ext}`;
    
    file.mv(`${process.env.FILE_UPLOAD_PATH}/team/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse("Problem with file upload", 500));
        }
        
        await Team.findByIdAndUpdate(req.params.id, { photo: `/uploads/team/${file.name}` });
        
        res.status(200).json({
            success: true,
            data: file.name
        });
    });
});

// @desc    Get team hierarchy for about page
// @route   GET /api/team/hierarchy
// @access  Public
exports.getTeamHierarchy = asyncHandler(async (req, res, next) => {
    const teamMembers = await Team.find({ status: "active" });
    
    const hierarchy = {
        president: [],
        "vice-president": [],
        treasurer: [],
        secretary: [],
        executive: [],
        auditor: []
    };
    
    teamMembers.forEach(member => {
        if (hierarchy[member.position]) {
            hierarchy[member.position].push(member);
        }
    });
    
    // Sort each position by order
    Object.keys(hierarchy).forEach(position => {
        hierarchy[position].sort((a, b) => a.order - b.order);
    });
    
    res.status(200).json({
        success: true,
        data: hierarchy
    });
});