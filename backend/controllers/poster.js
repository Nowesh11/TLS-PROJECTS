const Poster = require("../models/Poster");
const path = require("path");
const fs = require("fs").promises;

// Get active poster for public display
const getActivePoster = async (req, res) => {
    try {
        const now = new Date();
        const poster = await Poster.findOne({
            isActive: true,
            $or: [
                { startDate: { $lte: now } },
                { startDate: { $exists: false } }
            ],
            $or: [
                { endDate: { $gte: now } },
                { endDate: { $exists: false } },
                { endDate: null }
            ]
        })
        .sort({ priority: -1, createdAt: -1 })
        .populate("createdBy", "name email");

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "No active poster found"
            });
        }

        // Increment view count
        await poster.incrementViewCount();

        res.json({
            success: true,
            data: poster
        });
    } catch (error) {
        console.error("Error fetching active poster:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching poster",
            error: error.message
        });
    }
};

// Get all posters (admin only)
const getAllPosters = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        
        // Filter by status
        if (req.query.status) {
            query.isActive = req.query.status === "active";
        }

        // Search by title
        if (req.query.search) {
            query.$or = [
                { 'title.en': { $regex: req.query.search, $options: "i" } },
                { 'title.ta': { $regex: req.query.search, $options: "i" } },
                { 'description.en': { $regex: req.query.search, $options: "i" } },
                { 'description.ta': { $regex: req.query.search, $options: "i" } }
            ];
        }

        const posters = await Poster.find(query)
            .populate("createdBy updatedBy", "name email")
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Poster.countDocuments(query);

        // Language filtering
        let processedPosters = posters;
        if (req.query.lang && (req.query.lang === 'en' || req.query.lang === 'ta')) {
            processedPosters = posters.map(poster => {
                const posterObj = poster.toObject();
                
                // Transform bilingual fields to single language
                if (posterObj.title && typeof posterObj.title === 'object') {
                    posterObj.title = posterObj.title[req.query.lang] || posterObj.title.en;
                }
                if (posterObj.description && typeof posterObj.description === 'object') {
                    posterObj.description = posterObj.description[req.query.lang] || posterObj.description.en;
                }
                if (posterObj.buttonText && typeof posterObj.buttonText === 'object') {
                    posterObj.buttonText = posterObj.buttonText[req.query.lang] || posterObj.buttonText.en;
                }
                
                return posterObj;
            });
        }

        res.json({
            success: true,
            data: processedPosters,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error("Error fetching posters:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching posters",
            error: error.message
        });
    }
};

// Get single poster (admin only)
const getPoster = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id)
            .populate("createdBy updatedBy", "name email");

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "Poster not found"
            });
        }

        res.json({
            success: true,
            data: poster
        });
    } catch (error) {
        console.error("Error fetching poster:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching poster",
            error: error.message
        });
    }
};

// Create new poster (admin only)
const createPoster = async (req, res) => {
    try {
        const posterData = {
            ...req.body,
            createdBy: req.user.id
        };

        // If this poster is set as active, deactivate all others
        if (posterData.isActive) {
            await Poster.updateMany({}, { isActive: false });
        }

        const poster = new Poster(posterData);
        await poster.save();

        await poster.populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            message: "Poster created successfully",
            data: poster
        });
    } catch (error) {
        console.error("Error creating poster:", error);
        res.status(400).json({
            success: false,
            message: "Error creating poster",
            error: error.message
        });
    }
};

// Update poster (admin only)
const updatePoster = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "Poster not found"
            });
        }

        // If this poster is being set as active, deactivate all others
        if (req.body.isActive && !poster.isActive) {
            await Poster.updateMany({ _id: { $ne: poster._id } }, { isActive: false });
        }

        Object.assign(poster, req.body);
        poster.updatedBy = req.user.id;
        await poster.save();

        await poster.populate("createdBy updatedBy", "name email");

        res.json({
            success: true,
            message: "Poster updated successfully",
            data: poster
        });
    } catch (error) {
        console.error("Error updating poster:", error);
        res.status(400).json({
            success: false,
            message: "Error updating poster",
            error: error.message
        });
    }
};

// Delete poster (admin only)
const deletePoster = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "Poster not found"
            });
        }

        // Delete associated image file if it exists
        if (poster.image) {
            try {
                const imagePath = path.join(__dirname, "../../uploads", poster.image);
                await fs.unlink(imagePath);
            } catch (fileError) {
                console.log("Image file not found or already deleted:", fileError.message);
            }
        }

        await Poster.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Poster deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting poster:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting poster",
            error: error.message
        });
    }
};

// Toggle poster status (admin only)
const togglePosterStatus = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "Poster not found"
            });
        }

        // If activating this poster, deactivate all others
        if (!poster.isActive) {
            await Poster.updateMany({ _id: { $ne: poster._id } }, { isActive: false });
        }

        poster.isActive = !poster.isActive;
        poster.updatedBy = req.user.id;
        await poster.save();

        await poster.populate("createdBy updatedBy", "name email");

        res.json({
            success: true,
            message: `Poster ${poster.isActive ? "activated" : "deactivated"} successfully`,
            data: poster
        });
    } catch (error) {
        console.error("Error toggling poster status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating poster status",
            error: error.message
        });
    }
};

// Track poster click (public)
const trackPosterClick = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);

        if (!poster) {
            return res.status(404).json({
                success: false,
                message: "Poster not found"
            });
        }

        await poster.incrementClickCount();

        res.json({
            success: true,
            message: "Click tracked successfully"
        });
    } catch (error) {
        console.error("Error tracking poster click:", error);
        res.status(500).json({
            success: false,
            message: "Error tracking click",
            error: error.message
        });
    }
};

// Get poster statistics (admin only)
const getPosterStats = async (req, res) => {
    try {
        const stats = await Poster.aggregate([
            {
                $group: {
                    _id: null,
                    totalPosters: { $sum: 1 },
                    activePosters: {
                        $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                    },
                    totalViews: { $sum: "$viewCount" },
                    totalClicks: { $sum: "$clickCount" },
                    avgViews: { $avg: "$viewCount" },
                    avgClicks: { $avg: "$clickCount" }
                }
            }
        ]);

        const topPosters = await Poster.find()
            .sort({ viewCount: -1 })
            .limit(5);
        // Note: Mock database doesn't support .select() method

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalPosters: 0,
                    activePosters: 0,
                    totalViews: 0,
                    totalClicks: 0,
                    avgViews: 0,
                    avgClicks: 0
                },
                topPosters
            }
        });
    } catch (error) {
        console.error("Error fetching poster stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching statistics",
            error: error.message
        });
    }
};

module.exports = {
    getActivePoster,
    getAllPosters,
    getPoster,
    createPoster,
    updatePoster,
    deletePoster,
    togglePosterStatus,
    trackPosterClick,
    getPosterStats
};