const ProjectParticipant = require("../models/ProjectParticipant");
const Project = require("../models/Project");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all project participants
// @route   GET /api/project-participants
// @access  Private (Admin only)
exports.getProjectParticipants = async (req, res, next) => {
    try {
        // Build query object
        let queryObj = {};

        // Filter by project
        if (req.query.project) {
            queryObj.project = req.query.project;
        }

        // Filter by status
        if (req.query.status) {
            queryObj.status = req.query.status;
        }

        // Filter by project type
        if (req.query.projectType) {
            queryObj.projectType = req.query.projectType;
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            queryObj.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Create query with filters
        let query = ProjectParticipant.find(queryObj);

        // Sort by creation date (newest first)
        query = query.sort("-createdAt");

        // Populate references
        query = query.populate("project", "title titleTamil projectType category")
                     .populate("user", "name email phone");

        const participants = await query;

        res.status(200).json({
            success: true,
            count: participants.length,
            data: participants
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project participant
// @route   GET /api/project-participants/:id
// @access  Private (Admin only)
exports.getProjectParticipant = async (req, res, next) => {
    try {
        const participant = await ProjectParticipant.findById(req.params.id)
            .populate("project", "title titleTamil projectType category description")
            .populate("user", "name email phone");

        if (!participant) {
            return next(new ErrorResponse(`Participant not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: participant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new project participant
// @route   POST /api/project-participants
// @access  Public
exports.createProjectParticipant = async (req, res, next) => {
    try {
        const { projectId } = req.body;

        // Validate project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return next(new ErrorResponse("Project not found", 404));
        }

        // Check if participant already exists for this project and email
        const existingParticipant = await ProjectParticipant.findOne({
            project: projectId,
            email: req.body.email
        });

        if (existingParticipant) {
            return next(new ErrorResponse("You have already joined this project", 400));
        }

        // Create participant record
        const participantData = {
            project: projectId,
            projectTitle: project.title,
            projectType: project.projectType,
            ...req.body
        };

        // If user is authenticated, link to user
        if (req.user) {
            participantData.user = req.user.id;
        }

        const participant = await ProjectParticipant.create(participantData);

        // Update project participant count
        await Project.findByIdAndUpdate(projectId, {
            $inc: { participantCount: 1 }
        });

        // Populate the response
        await participant.populate("project", "title titleTamil projectType category");
        if (participant.user) {
            await participant.populate("user", "name email");
        }

        res.status(201).json({
            success: true,
            data: participant
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: errors.join(", ")
            });
        }
        next(error);
    }
};

// @desc    Update project participant
// @route   PUT /api/project-participants/:id
// @access  Private (Admin only)
exports.updateProjectParticipant = async (req, res, next) => {
    try {
        const participant = await ProjectParticipant.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate("project", "title titleTamil projectType category")
         .populate("user", "name email");

        if (!participant) {
            return next(new ErrorResponse(`Participant not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: participant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project participant
// @route   DELETE /api/project-participants/:id
// @access  Private (Admin only)
exports.deleteProjectParticipant = async (req, res, next) => {
    try {
        const participant = await ProjectParticipant.findById(req.params.id);

        if (!participant) {
            return next(new ErrorResponse(`Participant not found with id of ${req.params.id}`, 404));
        }

        // Update project participant count
        await Project.findByIdAndUpdate(participant.project, {
            $inc: { participantCount: -1 }
        });

        await participant.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update participant status
// @route   PUT /api/project-participants/:id/status
// @access  Private (Admin only)
exports.updateParticipantStatus = async (req, res, next) => {
    try {
        const { status, adminNotes, role } = req.body;

        const updateData = { status };
        if (adminNotes) updateData.adminNotes = adminNotes;
        if (role) updateData.role = role;

        // Set approval date when status changes to approved
        if (status === "approved") {
            updateData.approvedAt = new Date();
            updateData.approvedBy = req.user.id;
        }

        const participant = await ProjectParticipant.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate("project", "title titleTamil projectType category")
         .populate("user", "name email")
         .populate("approvedBy", "name email");

        if (!participant) {
            return next(new ErrorResponse(`Participant not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: participant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get participants by project
// @route   GET /api/project-participants/project/:projectId
// @access  Public
exports.getParticipantsByProject = async (req, res, next) => {
    try {
        const participants = await ProjectParticipant.find({
            project: req.params.projectId,
            status: "approved" // Only show approved participants publicly
        })
        .populate("user", "name")
        .select("name email role joinedAt")
        .sort("-joinedAt");

        res.status(200).json({
            success: true,
            count: participants.length,
            data: participants
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export project participants to CSV
// @route   GET /api/project-participants/export
// @access  Private (Admin only)
exports.exportProjectParticipants = async (req, res, next) => {
    try {
        const participants = await ProjectParticipant.find()
            .populate("project", "title titleTamil projectType category")
            .populate("user", "name email phone")
            .populate("approvedBy", "name email")
            .sort("-createdAt");

        // Convert to CSV format
        const csvHeaders = [
            "ID", "Name", "Email", "Phone", "Project Title", "Project Type",
            "Status", "Role", "Form Data", "Join Date", "Approved Date",
            "Approved By", "Admin Notes"
        ];

        const csvData = participants.map(participant => [
            participant._id,
            participant.name,
            participant.email,
            participant.phone || "",
            participant.project ? participant.project.title : participant.projectTitle,
            participant.projectType,
            participant.status,
            participant.role || "",
            participant.formData ? JSON.stringify(participant.formData) : "",
            participant.createdAt.toISOString().split("T")[0],
            participant.approvedAt ? participant.approvedAt.toISOString().split("T")[0] : "",
            participant.approvedBy ? participant.approvedBy.name : "",
            participant.adminNotes || ""
        ]);

        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(","))
            .join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=project-participants.csv");
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

// @desc    Get participants statistics
// @route   GET /api/project-participants/stats
// @access  Private (Admin only)
exports.getParticipantsStats = async (req, res, next) => {
    try {
        const totalParticipants = await ProjectParticipant.countDocuments();
        const pendingParticipants = await ProjectParticipant.countDocuments({ status: "pending" });
        const approvedParticipants = await ProjectParticipant.countDocuments({ status: "approved" });
        const rejectedParticipants = await ProjectParticipant.countDocuments({ status: "rejected" });

        // Project type statistics
        const projectTypeStats = await ProjectParticipant.aggregate([
            {
                $group: {
                    _id: "$projectType",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Monthly participation statistics
        const monthlyStats = await ProjectParticipant.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    participants: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
                $limit: 12
            }
        ]);

        // Top projects by participants
        const topProjects = await ProjectParticipant.aggregate([
            {
                $group: {
                    _id: "$project",
                    participantCount: { $sum: 1 },
                    projectTitle: { $first: "$projectTitle" }
                }
            },
            {
                $sort: { participantCount: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalParticipants,
                pendingParticipants,
                approvedParticipants,
                rejectedParticipants,
                projectTypeStats,
                monthlyStats,
                topProjects
            }
        });
    } catch (error) {
        next(error);
    }
};