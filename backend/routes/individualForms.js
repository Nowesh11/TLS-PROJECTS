/**
 * Individual Forms API Routes
 * Handles custom forms for individual projects, activities, and initiatives
 */

const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Activity = require("../models/Activity");
const Initiative = require("../models/Initiative");
const { protect, authorize } = require("../middleware/auth");

// Model mapping for different types
const getModel = (type) => {
    switch (type) {
        case "projects":
            return Project;
        case "activities":
            return Activity;
        case "initiatives":
            return Initiative;
        default:
            throw new Error("Invalid type");
    }
};

// Get custom form for a specific item
router.get("/:type/:itemId/form", protect, async (req, res) => {
    try {
        const { type, itemId } = req.params;
        const Model = getModel(type);
        
        const item = await Model.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        
        // Return the custom form data
        const customForm = item.customForm || {};
        
        res.json({
            success: true,
            data: customForm,
            itemTitle: item.title || item.name,
            itemType: type
        });
    } catch (error) {
        console.error("Error fetching custom form:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch custom form",
            error: error.message 
        });
    }
});

// Save/Update custom form for a specific item
router.post("/:type/:itemId/form", protect, authorize("admin"), async (req, res) => {
    try {
        const { type, itemId } = req.params;
        const formData = req.body;
        const Model = getModel(type);
        
        // Validate form data
        if (!formData || !formData.fields || !Array.isArray(formData.fields)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid form data. Fields array is required." 
            });
        }
        
        // Validate each field
        for (const field of formData.fields) {
            if (!field.type || !field.label || !field.name) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Each field must have type, label, and name properties." 
                });
            }
        }
        
        const item = await Model.findById(itemId);
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }
        
        // Update the custom form
        item.customForm = {
            title: formData.title || `Custom Form for ${item.title || item.name}`,
            description: formData.description || "",
            fields: formData.fields,
            settings: formData.settings || {},
            createdAt: item.customForm?.createdAt || new Date(),
            updatedAt: new Date()
        };
        
        await item.save();
        
        res.json({
            success: true,
            message: "Custom form saved successfully",
            data: item.customForm
        });
    } catch (error) {
        console.error("Error saving custom form:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to save custom form",
            error: error.message 
        });
    }
});

// Delete custom form for a specific item
router.delete("/:type/:itemId/form", protect, authorize("admin"), async (req, res) => {
    try {
        const { type, itemId } = req.params;
        const Model = getModel(type);
        
        const item = await Model.findById(itemId);
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }
        
        // Remove the custom form
        item.customForm = undefined;
        await item.save();
        
        res.json({
            success: true,
            message: "Custom form deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting custom form:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete custom form",
            error: error.message 
        });
    }
});

// Get all items with their custom form status
router.get("/:type/forms-status", protect, async (req, res) => {
    try {
        const { type } = req.params;
        const Model = getModel(type);
        
        const items = await Model.find({}, {
            title: 1,
            name: 1,
            category: 1,
            status: 1,
            customForm: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });
        
        // Add form status to each item
        const itemsWithFormStatus = items.map(item => ({
            _id: item._id,
            title: item.title || item.name,
            category: item.category,
            status: item.status,
            hasCustomForm: !!(item.customForm && Object.keys(item.customForm).length > 0),
            customFormFields: item.customForm?.fields?.length || 0,
            customFormUpdated: item.customForm?.updatedAt,
            createdAt: item.createdAt
        }));
        
        res.json({
            success: true,
            data: itemsWithFormStatus,
            total: itemsWithFormStatus.length
        });
    } catch (error) {
        console.error("Error fetching items with form status:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch items with form status",
            error: error.message 
        });
    }
});

// Submit a custom form (for public use) - both routes for compatibility
router.post("/:type/:itemId/submit", async (req, res) => {
    return handleFormSubmission(req, res);
});

router.post("/:type/:itemId/form/submit", async (req, res) => {
    return handleFormSubmission(req, res);
});

// Form submission handler
async function handleFormSubmission(req, res) {
    try {
        const { type, itemId } = req.params;
        const submissionData = req.body;
        const Model = getModel(type);
        
        const item = await Model.findById(itemId);
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }
        
        if (!item.customForm || !item.customForm.fields) {
            return res.status(400).json({ 
                success: false, 
                message: "No custom form available for this item" 
            });
        }
        
        // Validate submission against form fields
        const requiredFields = item.customForm.fields.filter(field => field.required);
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!submissionData[field.name] || submissionData[field.name].toString().trim() === "") {
                missingFields.push(field.label);
            }
        }
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(", ")}` 
            });
        }
        
        // Store the submission (you might want to create a separate Submission model)
        const submission = {
            itemId: itemId,
            itemType: type,
            formData: submissionData,
            submittedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get("User-Agent")
        };
        
        // For now, we'll add it to the item's submissions array
        if (!item.formSubmissions) {
            item.formSubmissions = [];
        }
        
        item.formSubmissions.push(submission);
        await item.save();
        
        res.json({
            success: true,
            message: "Form submitted successfully",
            submissionId: submission._id || item.formSubmissions.length
        });
    } catch (error) {
        console.error("Error submitting custom form:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to submit form",
            error: error.message 
        });
    }
}

// Get form submissions for a specific item (admin only)
router.get("/:type/:itemId/form/submissions", protect, authorize("admin"), async (req, res) => {
    try {
        const { type, itemId } = req.params;
        const Model = getModel(type);
        
        const item = await Model.findById(itemId, {
            title: 1,
            name: 1,
            formSubmissions: 1,
            customForm: 1
        });
        
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }
        
        const submissions = item.formSubmissions || [];
        
        res.json({
            success: true,
            data: {
                itemTitle: item.title || item.name,
                formTitle: item.customForm?.title,
                submissions: submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
                total: submissions.length
            }
        });
    } catch (error) {
        console.error("Error fetching form submissions:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch form submissions",
            error: error.message 
        });
    }
});

// Get form statistics (admin only)
router.get("/statistics", protect, authorize("admin"), async (req, res) => {
    try {
        const [projects, activities, initiatives] = await Promise.all([
            Project.find({}, { customForm: 1, formSubmissions: 1 }),
            Activity.find({}, { customForm: 1, formSubmissions: 1 }),
            Initiative.find({}, { customForm: 1, formSubmissions: 1 })
        ]);
        
        const calculateStats = (items) => {
            const withForms = items.filter(item => item.customForm && Object.keys(item.customForm).length > 0);
            const totalSubmissions = items.reduce((sum, item) => sum + (item.formSubmissions?.length || 0), 0);
            
            return {
                total: items.length,
                withCustomForms: withForms.length,
                withoutCustomForms: items.length - withForms.length,
                totalSubmissions
            };
        };
        
        const stats = {
            projects: calculateStats(projects),
            activities: calculateStats(activities),
            initiatives: calculateStats(initiatives)
        };
        
        // Overall statistics
        stats.overall = {
            totalItems: stats.projects.total + stats.activities.total + stats.initiatives.total,
            totalWithForms: stats.projects.withCustomForms + stats.activities.withCustomForms + stats.initiatives.withCustomForms,
            totalSubmissions: stats.projects.totalSubmissions + stats.activities.totalSubmissions + stats.initiatives.totalSubmissions
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Error fetching form statistics:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch form statistics",
            error: error.message 
        });
    }
});

module.exports = router;