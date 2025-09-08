const WebsiteContent = require('../models/WebsiteContent');
const WebsiteContentSection = require('../models/WebsiteContentSection');
const ActivityLog = require('../models/ActivityLog');
const ErrorResponse = require('../utils/errorResponse');
const multer = require('multer');
const path = require('path');

// Configure multer for logo uploads only
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/content/logos');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'logo') {
            cb(null, true);
        } else {
            cb(new Error('Only logo uploads are allowed'));
        }
    }
}).single('logo');

// @desc    Get all website content
// @route   GET /api/content
// @access  Public
exports.getContent = async (req, res, next) => {
    try {
        // Build query object
        let queryObj = {};

        // Filter by page
        if (req.query.page) {
            queryObj.page = req.query.page;
        }

        // Filter by section
        if (req.query.section) {
            queryObj.section = req.query.section;
        }

        // Check if user is authenticated as admin
        const isAdmin = req.user && req.user.role === "admin";
        
        // Filter by active status
        if (req.query.active !== undefined) {
            queryObj.isActive = req.query.active === "true";
        } else if (!isAdmin) {
            // Default to active content for public access only
            queryObj.isActive = true;
        }

        // Filter by visible status
        if (req.query.visible !== undefined) {
            queryObj.isVisible = req.query.visible === "true";
        } else if (!isAdmin) {
            // Default to visible content for public access only
            queryObj.isVisible = true;
        }

        // Filter by published content
        const now = new Date();
        queryObj.$and = [
            {
                $or: [
                    { publishedAt: { $lte: now } },
                    { publishedAt: null }
                ]
            },
            {
                $or: [
                    { expiresAt: { $gt: now } },
                    { expiresAt: null }
                ]
            }
        ];

        // Create query with filters
        let query = WebsiteContent.find(queryObj);

        // Sort by order and creation date
        query = query.sort("order createdAt");

        // Populate references
        query = query.populate("createdBy", "name email")
                     .populate("updatedBy", "name email")
                     .populate("approvedBy", "name email");

        const content = await query;

        // Language filtering
        let processedContent = content;
        if (req.query.lang && (req.query.lang === 'en' || req.query.lang === 'ta')) {
            processedContent = content.map(item => {
                const contentObj = item.toObject();
                
                // Transform bilingual fields to single language
                if (contentObj.title && typeof contentObj.title === 'object') {
                    contentObj.title = contentObj.title[req.query.lang] || contentObj.title.en;
                }
                if (contentObj.content && typeof contentObj.content === 'object') {
                    contentObj.content = contentObj.content[req.query.lang] || contentObj.content.en;
                }
                if (contentObj.description && typeof contentObj.description === 'object') {
                    contentObj.description = contentObj.description[req.query.lang] || contentObj.description.en;
                }
                if (contentObj.seoTitle && typeof contentObj.seoTitle === 'object') {
                    contentObj.seoTitle = contentObj.seoTitle[req.query.lang] || contentObj.seoTitle.en;
                }
                if (contentObj.seoDescription && typeof contentObj.seoDescription === 'object') {
                    contentObj.seoDescription = contentObj.seoDescription[req.query.lang] || contentObj.seoDescription.en;
                }
                if (contentObj.seoKeywords && typeof contentObj.seoKeywords === 'object') {
                    contentObj.seoKeywords = contentObj.seoKeywords[req.query.lang] || contentObj.seoKeywords.en;
                }
                
                return contentObj;
            });
        }

        res.status(200).json({
            success: true,
            count: processedContent.length,
            data: processedContent
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get content by page and section
// @route   GET /api/content/:page/:section
// @access  Public
exports.getContentByPageSection = async (req, res, next) => {
    try {
        const { page, section } = req.params;
        
        const now = new Date();
        const content = await WebsiteContent.find({
            page,
            section,
            isActive: true,
            isVisible: true,
            $or: [
                { publishDate: { $lte: now } },
                { publishDate: null }
            ],
            $and: [
                {
                    $or: [
                        { expirationDate: { $gt: now } },
                        { expirationDate: null }
                    ]
                }
            ]
        })
        .sort("order createdAt")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("approvedBy", "name email");

        res.status(200).json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single content item
// @route   GET /api/content/item/:id
// @access  Private (Admin only)
exports.getContentItem = async (req, res, next) => {
    try {
        const content = await WebsiteContent.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .populate("approvedBy", "name email");

        if (!content) {
            return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new content
// @route   POST /api/content
// @route   POST /api/content/page/:pageType
// @access  Private (Admin only)
exports.createContent = async (req, res, next) => {
    try {
        // Add user to req.body if user exists
        if (req.user && req.user.id) {
            req.body.createdBy = req.user.id;
        }

        // If pageType is provided in route params, use it
        if (req.params.pageType) {
            req.body.page = req.params.pageType;
        }

        // Ensure required fields are present
        if (!req.body.page) {
            return res.status(400).json({
                success: false,
                error: "Page is required"
            });
        }

        // Set default values if not provided
        if (!req.body.section) {
            req.body.section = "main";
        }
        if (!req.body.title) {
            req.body.title = `${req.body.page} Content`;
        }
        if (!req.body.order) {
            req.body.order = 1;
        }
        if (req.body.isActive === undefined) {
            req.body.isActive = true;
        }
        if (req.body.isVisible === undefined) {
            req.body.isVisible = true;
        }

        // Check if content already exists for this page/section
        const existingContent = await WebsiteContent.findOne({
            page: req.body.page,
            section: req.body.section
        });

        let content;
        if (existingContent) {
            // Update existing content
            if (req.user && req.user.id) {
                req.body.updatedBy = req.user.id;
            }
            content = await WebsiteContent.findByIdAndUpdate(existingContent._id, req.body, {
                new: true,
                runValidators: true
            });
        } else {
            // Create new content
            content = await WebsiteContent.create(req.body);
        }

        res.status(201).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error("Content creation error:", error);
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

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private (Admin only)
exports.updateContent = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.updatedBy = req.user.id;

        // If content is being published, set publish date
        if (req.body.isActive && !req.body.publishDate) {
            req.body.publishDate = new Date();
        }

        const content = await WebsiteContent.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!content) {
            return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Admin only)
exports.deleteContent = async (req, res, next) => {
    try {
        const content = await WebsiteContent.findById(req.params.id);

        if (!content) {
            return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
        }

        await content.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve content
// @route   PUT /api/content/:id/approve
// @access  Private (Admin only)
exports.approveContent = async (req, res, next) => {
    try {
        const content = await WebsiteContent.findByIdAndUpdate(
            req.params.id,
            {
                approvedBy: req.user.id,
                approvedAt: new Date(),
                active: true,
                publishDate: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!content) {
            return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Duplicate content
// @route   POST /api/content/:id/duplicate
// @access  Private (Admin only)
exports.duplicateContent = async (req, res, next) => {
    try {
        const originalContent = await WebsiteContent.findById(req.params.id);

        if (!originalContent) {
            return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
        }

        // Create a copy of the content
        const contentData = originalContent.toObject();
        delete contentData._id;
        delete contentData.createdAt;
        delete contentData.updatedAt;
        delete contentData.approvedAt;
        delete contentData.approvedBy;
        
        // Update metadata
        contentData.createdBy = req.user.id;
        contentData.active = false;
        contentData.visible = false;
        contentData.publishDate = null;
        contentData.version = 1;
        
        // Add "Copy" to title
        if (contentData.title.en) {
            contentData.title.en = `${contentData.title.en} (Copy)`;
        }
        if (contentData.title.ta) {
            contentData.title.ta = `${contentData.title.ta} (Copy)`;
        }

        const newContent = await WebsiteContent.create(contentData);

        res.status(201).json({
            success: true,
            data: newContent
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder content
// @route   PUT /api/content/reorder
// @access  Private (Admin only)
exports.reorderContent = async (req, res, next) => {
    try {
        const { items } = req.body; // Array of { id, order }

        const bulkOps = items.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order, updatedBy: req.user.id }
            }
        }));

        await WebsiteContent.bulkWrite(bulkOps);

        res.status(200).json({
            success: true,
            message: "Content reordered successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get content pages
// @route   GET /api/content/pages
// @access  Public
exports.getContentPages = async (req, res, next) => {
    try {
        const pages = await WebsiteContent.distinct("page");
        
        res.status(200).json({
            success: true,
            data: pages
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get content sections for a page
// @route   GET /api/content/pages/:page/sections
// @access  Public
exports.getContentSections = async (req, res, next) => {
    try {
        const sections = await WebsiteContent.distinct("section", { page: req.params.page });
        
        res.status(200).json({
            success: true,
            data: sections
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get content statistics
// @route   GET /api/content/stats
// @access  Private (Admin only)
exports.getContentStats = async (req, res, next) => {
    try {
        const totalContent = await WebsiteContent.countDocuments();
        const activeContent = await WebsiteContent.countDocuments({ active: true });
        const draftContent = await WebsiteContent.countDocuments({ active: false });
        const scheduledContent = await WebsiteContent.countDocuments({ 
            publishDate: { $gt: new Date() } 
        });
        const expiredContent = await WebsiteContent.countDocuments({ 
            expirationDate: { $lt: new Date() } 
        });

        const pageStats = await WebsiteContent.aggregate([
            {
                $group: {
                    _id: "$page",
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const sectionStats = await WebsiteContent.aggregate([
            {
                $group: {
                    _id: { page: "$page", section: "$section" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.page",
                    sections: {
                        $push: {
                            section: "$_id.section",
                            count: "$count"
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalContent,
                activeContent,
                draftContent,
                scheduledContent,
                expiredContent,
                pageStats,
                sectionStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to log activity
const logActivity = async (adminId, adminName, action, targetType, page, sectionKey, description, details, req) => {
    try {
        await ActivityLog.create({
            adminId,
            adminName,
            action,
            targetType,
            page,
            sectionKey,
            description,
            details,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent")
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

// @desc    Get all pages with their sections
// @route   GET /api/pages
// @access  Public
exports.getPages = async (req, res, next) => {
    try {
        const pages = await WebsiteContent.aggregate([
            {
                $group: {
                    _id: "$page",
                    sections: {
                        $push: {
                            sectionKey: "$sectionKey",
                            section: "$section",
                            title: "$title",
                            order: "$order",
                            position: "$position",
                            sectionType: "$sectionType",
                            layout: "$layout",
                            isActive: "$isActive",
                            isVisible: "$isVisible"
                        }
                    },
                    totalSections: { $sum: 1 },
                    activeSections: {
                        $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    page: "$_id",
                    sections: {
                        $sortArray: {
                            input: "$sections",
                            sortBy: { position: 1, order: 1 }
                        }
                    },
                    totalSections: 1,
                    activeSections: 1
                }
            },
            {
                $sort: { page: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: pages
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get page sections and content
// @route   GET /api/pages/:slug
// @access  Public
exports.getPageSections = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { includeInactive = false } = req.query;

        const filter = { page: slug };
        if (!includeInactive) {
            filter.isActive = true;
            filter.isVisible = true;
        }

        const sections = await WebsiteContent.find(filter)
            .sort({ position: 1, order: 1 })
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email")
            .populate("approvedBy", "name email");

        res.status(200).json({
            success: true,
            data: {
                page: slug,
                sections: sections
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new section in a page
// @route   POST /api/pages/:slug/sections
// @access  Private (Admin only)
exports.createPageSection = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const {
            sectionKey,
            section,
            sectionType,
            layout,
            position,
            title,
            content,
            subtitle,
            buttonText,
            buttonUrl,
            images,
            stylePreset,
            customStyles,
            isRequired,
            hasTamilTranslation
        } = req.body;

        // Handle bilingual content structure
        const bilingualTitle = title && typeof title === 'object' ? title : {
            en: title || '',
            ta: req.body.titleTamil || ''
        };
        
        const bilingualContent = content && typeof content === 'object' ? content : {
            en: content || '',
            ta: req.body.contentTamil || ''
        };
        
        const bilingualSubtitle = subtitle && typeof subtitle === 'object' ? subtitle : {
            en: subtitle || '',
            ta: req.body.subtitleTamil || ''
        };
        
        const bilingualButtonText = buttonText && typeof buttonText === 'object' ? buttonText : {
            en: buttonText || '',
            ta: req.body.buttonTextTamil || ''
        };

        // Check if section key already exists for this page
        const existingSection = await WebsiteContent.findOne({ page: slug, sectionKey });
        if (existingSection) {
            return next(new ErrorResponse(`Section with key '${sectionKey}' already exists on page '${slug}'`, 400));
        }

        // Get the next order number for this page
        const lastSection = await WebsiteContent.findOne({ page: slug }).sort({ order: -1 });
        const nextOrder = lastSection ? lastSection.order + 1 : 1;

        const newSection = await WebsiteContent.create({
            page: slug,
            sectionKey,
            section: section || sectionKey,
            sectionType: sectionType || "text",
            layout: layout || "full-width",
            position: position || 0,
            order: nextOrder,
            title: bilingualTitle,
            content: bilingualContent,
            subtitle: bilingualSubtitle,
            buttonText: bilingualButtonText,
            buttonUrl,
            images,
            stylePreset: stylePreset || "default",
            customStyles,
            isRequired: isRequired || false,
            hasTamilTranslation: hasTamilTranslation || (bilingualTitle.ta || bilingualContent.ta || bilingualSubtitle.ta || bilingualButtonText.ta) ? true : false,
            createdBy: req.user.id,
            isActive: true,
            isVisible: true
        });

        // Log activity
        await logActivity(
            req.user.id,
            req.user.name,
            "create",
            "section",
            slug,
            sectionKey,
            `Created new section '${sectionKey}' on page '${slug}'`,
            { sectionType, layout },
            req
        );

        res.status(201).json({
            success: true,
            data: newSection
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update section in a page
// @route   PATCH /api/pages/:slug/sections/:sectionKey
// @access  Private (Admin only)
exports.updatePageSection = async (req, res, next) => {
    try {
        const { slug, sectionKey } = req.params;
        const updateData = { ...req.body };
        
        // Add update metadata
        updateData.updatedBy = req.user.id;
        updateData.updatedAt = new Date();

        const section = await WebsiteContent.findOneAndUpdate(
            { page: slug, sectionKey },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!section) {
            return next(new ErrorResponse(`Section '${sectionKey}' not found on page '${slug}'`, 404));
        }

        // Log activity
        await logActivity(
            req.user.id,
            req.user.name,
            "edit",
            "section",
            slug,
            sectionKey,
            `Updated section '${sectionKey}' on page '${slug}'`,
            { updatedFields: Object.keys(req.body) },
            req
        );

        res.status(200).json({
            success: true,
            data: section
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete section from a page
// @route   DELETE /api/pages/:slug/sections/:sectionKey
// @access  Private (Admin only)
exports.deletePageSection = async (req, res, next) => {
    try {
        const { slug, sectionKey } = req.params;

        const section = await WebsiteContent.findOneAndDelete({ page: slug, sectionKey });

        if (!section) {
            return next(new ErrorResponse(`Section '${sectionKey}' not found on page '${slug}'`, 404));
        }

        // Log activity
        await logActivity(
            req.user.id,
            req.user.name,
            "delete",
            "section",
            slug,
            sectionKey,
            `Deleted section '${sectionKey}' from page '${slug}'`,
            { deletedSection: section.title },
            req
        );

        res.status(200).json({
            success: true,
            message: `Section '${sectionKey}' deleted successfully`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Duplicate section within same page or to another page
// @route   POST /api/pages/:slug/sections/:sectionKey/duplicate
// @access  Private (Admin only)
exports.duplicatePageSection = async (req, res, next) => {
    try {
        const { slug, sectionKey } = req.params;
        const { targetPage, newSectionKey, position } = req.body;

        const originalSection = await WebsiteContent.findOne({ page: slug, sectionKey });

        if (!originalSection) {
            return next(new ErrorResponse(`Section '${sectionKey}' not found on page '${slug}'`, 404));
        }

        // Check if new section key already exists on target page
        const targetPageSlug = targetPage || slug;
        const existingSection = await WebsiteContent.findOne({ 
            page: targetPageSlug, 
            sectionKey: newSectionKey 
        });
        
        if (existingSection) {
            return next(new ErrorResponse(`Section with key '${newSectionKey}' already exists on page '${targetPageSlug}'`, 400));
        }

        // Create duplicate
        const sectionData = originalSection.toObject();
        delete sectionData._id;
        delete sectionData.createdAt;
        delete sectionData.updatedAt;
        delete sectionData.approvedAt;
        delete sectionData.approvedBy;

        // Update metadata
        sectionData.page = targetPageSlug;
        sectionData.sectionKey = newSectionKey;
        sectionData.createdBy = req.user.id;
        sectionData.position = position || 0;
        
        // Get next order for target page
        const lastSection = await WebsiteContent.findOne({ page: targetPageSlug }).sort({ order: -1 });
        sectionData.order = lastSection ? lastSection.order + 1 : 1;

        // Add "Copy" to title
        if (sectionData.title && sectionData.title.en) {
            sectionData.title.en = `${sectionData.title.en} (Copy)`;
        }
        if (sectionData.title && sectionData.title.ta) {
            sectionData.title.ta = `${sectionData.title.ta} (Copy)`;
        }

        const duplicatedSection = await WebsiteContent.create(sectionData);

        // Log activity
        await logActivity(
            req.user.id,
            req.user.name,
            "duplicate",
            "section",
            targetPageSlug,
            newSectionKey,
            `Duplicated section '${sectionKey}' from page '${slug}' to '${targetPageSlug}' as '${newSectionKey}'`,
            { originalPage: slug, originalSectionKey: sectionKey },
            req
        );

        res.status(201).json({
            success: true,
            data: duplicatedSection
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activity log for a page
// @route   GET /api/activity
// @access  Public (with limited data for non-authenticated users)
exports.getActivityLog = async (req, res, next) => {
    try {
        const { page, limit = 50, offset = 0, action, adminId } = req.query;

        const filter = {};
        if (page) filter.page = page;
        if (action) filter.action = action;
        if (adminId) filter.adminId = adminId;

        // Check if user is authenticated (optional for this endpoint)
        const isAuthenticated = req.user && req.user.role === "admin";
        
        let activities;
        if (isAuthenticated) {
            // Full data for authenticated admin users
            activities = await ActivityLog.find(filter)
                .populate("adminId", "name email")
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset));
        } else {
            // Limited data for non-authenticated users (empty array for now)
            activities = [];
        }

        const total = isAuthenticated ? await ActivityLog.countDocuments(filter) : 0;

        res.status(200).json({
            success: true,
            data: {
                activities,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get content by page
exports.getContentByPage = async (req, res) => {
    try {
        const { page } = req.query;
        if (!page) {
            return res.status(400).json({ error: 'Page parameter is required' });
        }

        const content = await WebsiteContent.find({ page })
            .populate('sectionId')
            .sort({ 'sectionId.order': 1 });

        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch content' });
    }
};

// Get all sections
exports.getSections = async (req, res) => {
    try {
        const sections = await WebsiteContentSection.find()
            .sort({ order: 1 });
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sections' });
    }
};

// Create new section
exports.createSection = async (req, res) => {
    try {
        const { title, type, order } = req.body;
        
        const section = await WebsiteContentSection.create({
            title,
            type,
            order: order || await getNextOrder()
        });

        // Create initial content for all pages
        const pages = ['home', 'about', 'contact'];
        await Promise.all(pages.map(page => 
            WebsiteContent.create({
                page,
                sectionId: section._id,
                content: getInitialContent(type)
            })
        ));

        res.json(section);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create section' });
    }
};

// Update content
exports.updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const updatedContent = await WebsiteContent.findByIdAndUpdate(
            id,
            { content },
            { new: true }
        );

        // Emit update event for real-time sync
        req.app.get('io')?.emit('contentUpdated', {
            page: updatedContent.page,
            sectionId: updatedContent.sectionId
        });

        res.json(updatedContent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update content' });
    }
};

// Upload logo
exports.uploadLogo = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const { id } = req.params;
            const content = await WebsiteContent.findByIdAndUpdate(
                id,
                { 'content.logo': `/uploads/content/logos/${req.file.filename}` },
                { new: true }
            );
            res.json(content);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update content with logo' });
        }
    });
};

// Get recent changes
exports.getRecentChanges = async (req, res) => {
    try {
        const changes = await WebsiteContent.find()
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('sectionId');
        res.json(changes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent changes' });
    }
};

// Helper functions
async function getNextOrder() {
    const lastSection = await WebsiteContentSection.findOne()
        .sort({ order: -1 });
    return (lastSection?.order || 0) + 1;
}

function getInitialContent(type) {
    const baseContent = {
        header: 'New Section',
        subheader: 'Enter content here'
    };

    switch (type) {
        case 'hero':
            return {
                ...baseContent,
                imageUrl: '',
                buttonText: 'Learn More',
                buttonUrl: '#'
            };
        case 'statistics':
            return {
                ...baseContent,
                stats: [
                    { label: 'Statistic 1', value: '0' },
                    { label: 'Statistic 2', value: '0' }
                ]
            };
        default:
            return baseContent;
    }
}