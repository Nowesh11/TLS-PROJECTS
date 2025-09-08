const FormConfiguration = require("../models/FormConfiguration");
const Project = require("../models/Project");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all form configurations
// @route   GET /api/form-configurations
// @access  Private (Admin only)
exports.getFormConfigurations = async (req, res, next) => {
    try {
        // Build query object
        let queryObj = {};

        // Filter by item type
        if (req.query.itemType) {
            queryObj.itemType = req.query.itemType;
        }

        // Filter by item ID
        if (req.query.itemId) {
            queryObj.itemId = req.query.itemId;
        }

        // Filter by form types
        if (req.query.formType) {
            queryObj.formTypes = { $in: [req.query.formType] };
        }

        // Filter by active status
        if (req.query.isActive !== undefined) {
            queryObj.isActive = req.query.isActive === "true";
        }

        // Create query with filters
        let query = FormConfiguration.find(queryObj);

        // Sort by creation date (newest first)
        query = query.sort("-createdAt");

        // Populate references
        query = query.populate("createdBy", "name email")
                     .populate("updatedBy", "name email");

        const formConfigurations = await query;

        res.status(200).json({
            success: true,
            count: formConfigurations.length,
            data: formConfigurations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single form configuration
// @route   GET /api/form-configurations/:id
// @access  Private (Admin only)
exports.getFormConfiguration = async (req, res, next) => {
    try {
        const formConfiguration = await FormConfiguration.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email");

        if (!formConfiguration) {
            return next(new ErrorResponse(`Form configuration not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: formConfiguration
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get form configuration by item
// @route   GET /api/form-configurations/item/:itemType/:itemId
// @access  Public
exports.getFormConfigurationByItem = async (req, res, next) => {
    try {
        const { itemType, itemId } = req.params;
        const { formType } = req.query; // participant, volunteer, crew

        let query = {
            itemType,
            itemId,
            isActive: true
        };

        // Filter by form type if specified
        if (formType) {
            query.formTypes = { $in: [formType] };
        }

        const formConfiguration = await FormConfiguration.findOne(query)
            .populate("createdBy", "name");

        if (!formConfiguration) {
            // Return default form configuration if none exists
            const defaultConfig = {
                title: "Join Form",
                description: "",
                formTypes: ["participant"],
                fields: [
                    {
                        id: "name",
                        type: "text",
                        name: "name",
                        label: "Full Name",
                        required: true,
                        order: 1,
                        width: "full"
                    },
                    {
                        id: "email",
                        type: "email",
                        name: "email",
                        label: "Email Address",
                        required: true,
                        order: 2,
                        width: "full"
                    },
                    {
                        id: "phone",
                        type: "tel",
                        name: "phone",
                        label: "Phone Number",
                        required: false,
                        order: 3,
                        width: "full"
                    },
                    {
                        id: "role",
                        type: "select",
                        name: "role",
                        label: "How would you like to contribute?",
                        required: true,
                        order: 4,
                        width: "full",
                        options: [
                            { value: "participant", label: "Participant" },
                            { value: "volunteer", label: "Volunteer" },
                            { value: "crew", label: "Crew Member" }
                        ]
                    },
                    {
                        id: "message",
                        type: "textarea",
                        name: "message",
                        label: "Tell us about your interest and experience",
                        required: false,
                        order: 5,
                        width: "full"
                    }
                ],
                submitButton: {
                    text: "Submit",
                    color: "primary"
                },
                settings: {
                    thankYouMessage: "Thank you for your submission! We will contact you soon."
                }
            };

            return res.status(200).json({
                success: true,
                data: defaultConfig,
                isDefault: true
            });
        }

        res.status(200).json({
            success: true,
            data: formConfiguration,
            isDefault: false
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new form configuration
// @route   POST /api/form-configurations
// @access  Private (Admin only)
exports.createFormConfiguration = async (req, res, next) => {
    try {
        const { itemType, itemId } = req.body;

        // Validate that the item exists
        let itemModel;
        switch (itemType) {
            case "project":
                itemModel = require("../models/Project");
                break;
            case "activity":
                itemModel = require("../models/Activity");
                break;
            case "initiative":
                itemModel = require("../models/Initiative");
                break;
            default:
                return next(new ErrorResponse("Invalid item type", 400));
        }

        const item = await itemModel.findById(itemId);
        if (!item) {
            return next(new ErrorResponse(`${itemType} not found`, 404));
        }

        // Add creator information
        req.body.createdBy = req.user.id;

        // Ensure fields have proper order
        if (req.body.fields && Array.isArray(req.body.fields)) {
            req.body.fields = req.body.fields.map((field, index) => ({
                ...field,
                id: field.id || field.name || `field_${index}`,
                order: field.order || index + 1
            }));
        }

        const formConfiguration = await FormConfiguration.create(req.body);

        // Populate the response
        await formConfiguration.populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            data: formConfiguration
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

// @desc    Update form configuration
// @route   PUT /api/form-configurations/:id
// @access  Private (Admin only)
exports.updateFormConfiguration = async (req, res, next) => {
    try {
        // Add updater information
        req.body.updatedBy = req.user.id;

        // Ensure fields have proper order
        if (req.body.fields && Array.isArray(req.body.fields)) {
            req.body.fields = req.body.fields.map((field, index) => ({
                ...field,
                id: field.id || field.name || `field_${index}`,
                order: field.order || index + 1
            }));
        }

        const formConfiguration = await FormConfiguration.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate("createdBy", "name email")
         .populate("updatedBy", "name email");

        if (!formConfiguration) {
            return next(new ErrorResponse(`Form configuration not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: formConfiguration
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

// @desc    Delete form configuration
// @route   DELETE /api/form-configurations/:id
// @access  Private (Admin only)
exports.deleteFormConfiguration = async (req, res, next) => {
    try {
        const formConfiguration = await FormConfiguration.findById(req.params.id);

        if (!formConfiguration) {
            return next(new ErrorResponse(`Form configuration not found with id of ${req.params.id}`, 404));
        }

        await formConfiguration.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle form configuration active status
// @route   PUT /api/form-configurations/:id/toggle
// @access  Private (Admin only)
exports.toggleFormConfiguration = async (req, res, next) => {
    try {
        const formConfiguration = await FormConfiguration.findById(req.params.id);

        if (!formConfiguration) {
            return next(new ErrorResponse(`Form configuration not found with id of ${req.params.id}`, 404));
        }

        formConfiguration.isActive = !formConfiguration.isActive;
        formConfiguration.updatedBy = req.user.id;
        await formConfiguration.save();

        await formConfiguration.populate("createdBy", "name email");
        await formConfiguration.populate("updatedBy", "name email");

        res.status(200).json({
            success: true,
            data: formConfiguration
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Duplicate form configuration
// @route   POST /api/form-configurations/:id/duplicate
// @access  Private (Admin only)
exports.duplicateFormConfiguration = async (req, res, next) => {
    try {
        const originalConfig = await FormConfiguration.findById(req.params.id);

        if (!originalConfig) {
            return next(new ErrorResponse(`Form configuration not found with id of ${req.params.id}`, 404));
        }

        // Create a copy with modified title and reset stats
        const duplicateData = {
            ...originalConfig.toObject(),
            _id: undefined,
            title: `${originalConfig.title} (Copy)`,
            createdBy: req.user.id,
            updatedBy: undefined,
            submissionCount: 0,
            lastSubmissionAt: undefined,
            createdAt: undefined,
            updatedAt: undefined
        };

        const duplicateConfig = await FormConfiguration.create(duplicateData);
        await duplicateConfig.populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            data: duplicateConfig
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get form configuration analytics
// @route   GET /api/form-configurations/:id/analytics
// @access  Private (Admin only)
exports.getFormAnalytics = async (req, res, next) => {
    try {
        const formConfiguration = await FormConfiguration.findById(req.params.id);

        if (!formConfiguration) {
            return next(new ErrorResponse(`Form configuration not found with id of ${req.params.id}`, 404));
        }

        // Removed ProjectParticipant statistics (feature removed)
        // const ProjectParticipant = require('../models/ProjectParticipant');
        
        // Mock stats since ProjectParticipant was removed
        const stats = [{ _id: null, totalSubmissions: 0, avgResponseTime: 0 }]; 
        /* Removed ProjectParticipant aggregation pipeline
        await ProjectParticipant.aggregate([
            {
                $match: {
                    project: formConfiguration.itemId,
                    projectType: formConfiguration.itemType
                }
            },
            {
                $group: {
                    _id: null,
                    totalSubmissions: { $sum: 1 },
                    pendingSubmissions: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    approvedSubmissions: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                    },
                    rejectedSubmissions: {
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                    },
                    participantCount: {
                        $sum: { $cond: [{ $eq: ['$role', 'participant'] }, 1, 0] }
                    },
                    volunteerCount: {
                        $sum: { $cond: [{ $eq: ['$role', 'volunteer'] }, 1, 0] }
                    },
                    crewCount: {
                        $sum: { $cond: [{ $eq: ['$role', 'crew'] }, 1, 0] }
                    }
                }
            }
        ]);
        */

        const analytics = stats[0] || {
            totalSubmissions: 0,
            pendingSubmissions: 0,
            approvedSubmissions: 0,
            rejectedSubmissions: 0,
            participantCount: 0,
            volunteerCount: 0,
            crewCount: 0
        };

        res.status(200).json({
            success: true,
            data: {
                formConfiguration: {
                    id: formConfiguration._id,
                    title: formConfiguration.title,
                    itemType: formConfiguration.itemType,
                    itemId: formConfiguration.itemId,
                    isActive: formConfiguration.isActive,
                    createdAt: formConfiguration.createdAt
                },
                analytics
            }
        });
    } catch (error) {
        next(error);
    }
};