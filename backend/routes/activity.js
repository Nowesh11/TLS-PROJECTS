const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { protect: auth } = require("../middleware/auth");
const asyncHandler = require("../middleware/async");

// @desc    Get activity logs
// @route   GET /api/activity
// @access  Private (Admin only)
router.get("/", auth, asyncHandler(async (req, res) => {
    const { page, limit = 10, targetType, action } = req.query;
    
    // Build query object
    let query = {};
    
    // Filter by page if provided
    if (page && page !== "all") {
        query.page = page;
    }
    
    // Filter by target type if provided
    if (targetType) {
        query.targetType = targetType;
    }
    
    // Filter by action if provided
    if (action) {
        query.action = action;
    }
    
    try {
        // Get total count for pagination
        const total = await ActivityLog.countDocuments(query);
        
        // Get activity logs with pagination
        const activities = await ActivityLog.find(query)
            .populate("adminId", "name email")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(0); // For now, we'll just get the latest entries
        
        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            data: activities.map(activity => ({
                _id: activity._id,
                adminId: activity.adminId,
                adminName: activity.adminName,
                action: activity.action,
                targetType: activity.targetType,
                targetId: activity.targetId,
                page: activity.page,
                sectionKey: activity.sectionKey,
                description: activity.description,
                details: activity.details,
                ipAddress: activity.ipAddress,
                userAgent: activity.userAgent,
                createdAt: activity.createdAt,
                updatedAt: activity.updatedAt
            }))
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activity logs",
            error: error.message
        });
    }
}));

// @desc    Create activity log entry
// @route   POST /api/activity
// @access  Private (Admin only)
router.post("/", auth, asyncHandler(async (req, res) => {
    const {
        action,
        targetType,
        targetId,
        page,
        sectionKey,
        description,
        details
    } = req.body;
    
    try {
        const activityLog = await ActivityLog.create({
            adminId: req.user.id,
            adminName: req.user.name || req.user.email,
            action,
            targetType,
            targetId,
            page,
            sectionKey,
            description,
            details,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent")
        });
        
        res.status(201).json({
            success: true,
            data: activityLog
        });
    } catch (error) {
        console.error("Error creating activity log:", error);
        res.status(500).json({
            success: false,
            message: "Error creating activity log",
            error: error.message
        });
    }
}));

// @desc    Get activity logs for specific page
// @route   GET /api/activity/page/:page
// @access  Private (Admin only)
router.get("/page/:page", auth, asyncHandler(async (req, res) => {
    const { page } = req.params;
    const { limit = 10 } = req.query;
    
    try {
        const activities = await ActivityLog.find({ page })
            .populate("adminId", "name email")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        console.error("Error fetching page activity logs:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching page activity logs",
            error: error.message
        });
    }
}));

// @desc    Delete activity log entry
// @route   DELETE /api/activity/:id
// @access  Private (Admin only)
router.delete("/:id", auth, asyncHandler(async (req, res) => {
    try {
        const activityLog = await ActivityLog.findById(req.params.id);
        
        if (!activityLog) {
            return res.status(404).json({
                success: false,
                message: "Activity log not found"
            });
        }
        
        await activityLog.deleteOne();
        
        res.status(200).json({
            success: true,
            message: "Activity log deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting activity log:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting activity log",
            error: error.message
        });
    }
}));

module.exports = router;