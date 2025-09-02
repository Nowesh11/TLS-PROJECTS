const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/auth");
const FormConfiguration = require("../models/FormConfiguration");
const FormResponse = require("../models/FormResponse");

/**
 * Get recruitment statistics for dashboard
 * GET /api/recruitment/stats
 */
router.get("/stats", auth, async (req, res) => {
    try {
        // Check if user has admin privileges
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        // Count recruitment forms by entity type
        const projectForms = await FormConfiguration.countDocuments({
            entityType: "project",
            isActive: true
        });

        const activityForms = await FormConfiguration.countDocuments({
            entityType: "activity",
            isActive: true
        });

        const initiativeForms = await FormConfiguration.countDocuments({
            entityType: "initiative",
            isActive: true
        });

        const totalForms = projectForms + activityForms + initiativeForms;

        // Count total responses
        const totalResponses = await FormResponse.countDocuments();

        // Get recent activity (optional)
        const recentForms = await FormConfiguration.find({
            isActive: true
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title entityType createdAt");

        res.json({
            success: true,
            data: {
                totalForms,
                projectForms,
                activityForms,
                initiativeForms,
                totalResponses,
                recentForms
            }
        });

    } catch (error) {
        console.error("Error fetching recruitment stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recruitment statistics",
            error: error.message
        });
    }
});

/**
 * Get detailed recruitment analytics
 * GET /api/recruitment/analytics
 */
router.get("/analytics", auth, async (req, res) => {
    try {
        // Check if user has admin privileges
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        // Get forms with response counts
        const formsWithStats = await FormConfiguration.aggregate([
            {
                $lookup: {
                    from: "formresponses",
                    localField: "_id",
                    foreignField: "formId",
                    as: "responses"
                }
            },
            {
                $project: {
                    title: 1,
                    entityType: 1,
                    isActive: 1,
                    createdAt: 1,
                    responseCount: { $size: "$responses" },
                    maxApplications: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        // Calculate completion rates
        const analyticsData = formsWithStats.map(form => ({
            ...form,
            completionRate: form.maxApplications ? 
                Math.round((form.responseCount / form.maxApplications) * 100) : null
        }));

        res.json({
            success: true,
            data: {
                forms: analyticsData,
                summary: {
                    totalForms: formsWithStats.length,
                    activeForms: formsWithStats.filter(f => f.isActive).length,
                    totalResponses: formsWithStats.reduce((sum, f) => sum + f.responseCount, 0),
                    averageResponsesPerForm: formsWithStats.length > 0 ? 
                        Math.round(formsWithStats.reduce((sum, f) => sum + f.responseCount, 0) / formsWithStats.length) : 0
                }
            }
        });

    } catch (error) {
        console.error("Error fetching recruitment analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recruitment analytics",
            error: error.message
        });
    }
});

module.exports = router;