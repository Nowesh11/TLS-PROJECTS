const Poster = require("../models/Poster");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all posters
// @route   GET /api/posters
// @access  Private (Admin only)
exports.getPosters = async (req, res, next) => {
    try {
        // Build query object
        let queryObj = {};

        // Filter by status
        if (req.query.status) {
            queryObj.status = req.query.status;
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            queryObj.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Create query with filters
        let query = Poster.find(queryObj);

        // Sort by priority and creation date
        query = query.sort("-priority -createdAt");

        // Populate references
        query = query.populate("createdBy", "name email")
                     .populate("updatedBy", "name email");

        const posters = await query;

        res.status(200).json({
            success: true,
            count: posters.length,
            data: posters
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single poster
// @route   GET /api/posters/:id
// @access  Private (Admin only)
exports.getPoster = async (req, res, next) => {
    try {
        const poster = await Poster.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email");

        if (!poster) {
            return next(new ErrorResponse(`Poster not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: poster
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new poster
// @route   POST /api/posters
// @access  Private (Admin only)
exports.createPoster = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        // If this poster is being set as active, deactivate all other posters
        if (req.body.status === "active") {
            await Poster.updateMany(
                { status: "active" },
                { status: "inactive" }
            );
        }

        const poster = await Poster.create(req.body);

        // Populate the response
        await poster.populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            data: poster
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

// @desc    Update poster
// @route   PUT /api/posters/:id
// @access  Private (Admin only)
exports.updatePoster = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.updatedBy = req.user.id;

        // If this poster is being set as active, deactivate all other posters
        if (req.body.status === "active") {
            await Poster.updateMany(
                { status: "active", _id: { $ne: req.params.id } },
                { status: "inactive" }
            );
        }

        const poster = await Poster.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate("createdBy", "name email")
         .populate("updatedBy", "name email");

        if (!poster) {
            return next(new ErrorResponse(`Poster not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: poster
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete poster
// @route   DELETE /api/posters/:id
// @access  Private (Admin only)
exports.deletePoster = async (req, res, next) => {
    try {
        const poster = await Poster.findById(req.params.id);

        if (!poster) {
            return next(new ErrorResponse(`Poster not found with id of ${req.params.id}`, 404));
        }

        await poster.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get active posters
// @route   GET /api/posters/active
// @access  Public
exports.getActivePosters = async (req, res, next) => {
    try {
        const now = new Date();
        
        const posters = await Poster.find({
            status: "active",
            $or: [
                { startDate: { $lte: now } },
                { startDate: null }
            ],
            $and: [
                {
                    $or: [
                        { endDate: { $gte: now } },
                        { endDate: null }
                    ]
                }
            ]
        })
        .sort("-priority -createdAt")
        .limit(1); // Only return the top priority active poster

        res.status(200).json({
            success: true,
            count: posters.length,
            data: posters
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Track poster view
// @route   POST /api/posters/:id/view
// @access  Public
exports.trackPosterView = async (req, res, next) => {
    try {
        const poster = await Poster.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        );

        if (!poster) {
            return next(new ErrorResponse(`Poster not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: { viewCount: poster.viewCount }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Track poster click
// @route   POST /api/posters/:id/click
// @access  Public
exports.trackPosterClick = async (req, res, next) => {
    try {
        const poster = await Poster.findByIdAndUpdate(
            req.params.id,
            { $inc: { clickCount: 1 } },
            { new: true }
        );

        if (!poster) {
            return next(new ErrorResponse(`Poster not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: { clickCount: poster.clickCount }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export posters to CSV
// @route   GET /api/posters/export
// @access  Private (Admin only)
exports.exportPosters = async (req, res, next) => {
    try {
        const posters = await Poster.find()
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .sort("-createdAt");

        // Convert to CSV format
        const csvHeaders = [
            "ID", "Title", "Title Tamil", "Description", "Status", "Priority",
            "View Count", "Click Count", "Start Date", "End Date", "Created By",
            "Created Date", "Updated By", "Updated Date", "Action Button Text",
            "Action Button URL", "SEO Title", "SEO Description"
        ];

        const csvData = posters.map(poster => [
            poster._id,
            poster.title,
            poster.titleTamil || "",
            poster.description,
            poster.status,
            poster.priority,
            poster.viewCount,
            poster.clickCount,
            poster.startDate ? poster.startDate.toISOString().split("T")[0] : "",
            poster.endDate ? poster.endDate.toISOString().split("T")[0] : "",
            poster.createdBy ? poster.createdBy.name : "",
            poster.createdAt.toISOString().split("T")[0],
            poster.updatedBy ? poster.updatedBy.name : "",
            poster.updatedAt.toISOString().split("T")[0],
            poster.actionButton?.text || "",
            poster.actionButton?.url || "",
            poster.seoTitle || "",
            poster.seoDescription || ""
        ]);

        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(","))
            .join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=posters.csv");
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

// @desc    Get posters statistics
// @route   GET /api/posters/stats
// @access  Private (Admin only)
exports.getPostersStats = async (req, res, next) => {
    try {
        const totalPosters = await Poster.countDocuments();
        const activePosters = await Poster.countDocuments({ status: "active" });
        const inactivePosters = await Poster.countDocuments({ status: "inactive" });
        const scheduledPosters = await Poster.countDocuments({ 
            startDate: { $gt: new Date() } 
        });

        // Engagement statistics
        const engagementStats = await Poster.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$viewCount" },
                    totalClicks: { $sum: "$clickCount" },
                    averageViews: { $avg: "$viewCount" },
                    averageClicks: { $avg: "$clickCount" }
                }
            }
        ]);

        // Monthly poster statistics
        const monthlyStats = await Poster.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    posters: { $sum: 1 },
                    views: { $sum: "$viewCount" },
                    clicks: { $sum: "$clickCount" }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
                $limit: 12
            }
        ]);

        // Top performing posters
        const topPosters = await Poster.aggregate([
            {
                $addFields: {
                    engagementRate: {
                        $cond: [
                            { $gt: ["$viewCount", 0] },
                            { $divide: ["$clickCount", "$viewCount"] },
                            0
                        ]
                    }
                }
            },
            {
                $sort: { engagementRate: -1, viewCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    title: 1,
                    viewCount: 1,
                    clickCount: 1,
                    engagementRate: 1,
                    status: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalPosters,
                activePosters,
                inactivePosters,
                scheduledPosters,
                totalViews: engagementStats[0]?.totalViews || 0,
                totalClicks: engagementStats[0]?.totalClicks || 0,
                averageViews: engagementStats[0]?.averageViews || 0,
                averageClicks: engagementStats[0]?.averageClicks || 0,
                monthlyStats,
                topPosters
            }
        });
    } catch (error) {
        next(error);
    }
};