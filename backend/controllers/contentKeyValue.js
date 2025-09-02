const ContentKeyValue = require("../models/ContentKeyValue");
const MediaUpload = require("../models/MediaUpload");
const asyncHandler = require("express-async-handler");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all content as nested JSON structure
// @route   GET /api/content
// @access  Public
const getAllContent = asyncHandler(async (req, res) => {
    const { language = "en", page } = req.query;
    
    try {
        const nestedContent = await ContentKeyValue.buildNestedStructure(language, page);
        
        res.json({
            success: true,
            language,
            page: page || "all",
            data: nestedContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching content",
            error: error.message
        });
    }
});

// @desc    Get specific content item by content_key
// @route   GET /api/content/:key
// @access  Public
const getContentByKey = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { language = "en" } = req.query;
    
    const content = await ContentKeyValue.findOne({
        content_key: key,
        language,
        is_active: true
    });
    
    if (!content) {
        return res.status(404).json({
            success: false,
            message: `Content not found for key: ${key} in language: ${language}`
        });
    }
    
    res.json({
        success: true,
        data: {
            content_key: content.content_key,
            content_value: content.content_value,
            language: content.language,
            type: content.type,
            last_updated: content.last_updated
        }
    });
});

// @desc    Update multiple content items in bulk
// @route   POST /api/content
// @access  Private/Admin
const bulkUpdateContent = asyncHandler(async (req, res) => {
    const updates = req.body;
    const userId = req.user.id;
    
    if (!updates || typeof updates !== "object") {
        return res.status(400).json({
            success: false,
            message: "Invalid update data format"
        });
    }
    
    try {
        const result = await ContentKeyValue.bulkUpdate(updates, userId);
        
        res.json({
            success: true,
            message: "Content updated successfully",
            data: {
                modified_count: result?.modifiedCount || 0,
                upserted_count: result?.upsertedCount || 0,
                matched_count: result?.matchedCount || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating content",
            error: error.message
        });
    }
});

// @desc    Create or update single content item
// @route   PUT /api/content/:key
// @access  Private/Admin
const updateContentByKey = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { content_value, language = "en", type = "text", alt_text, meta_description } = req.body;
    
    if (!content_value) {
        return res.status(400).json({
            success: false,
            message: "Content value is required"
        });
    }
    
    const content = await ContentKeyValue.findOneAndUpdate(
        { content_key: key, language },
        {
            content_value,
            type,
            alt_text,
            meta_description,
            updated_by: req.user.id,
            last_updated: new Date()
        },
        {
            new: true,
            upsert: true,
            runValidators: true
        }
    );
    
    res.json({
        success: true,
        message: "Content updated successfully",
        data: content
    });
});

// @desc    Delete content item
// @route   DELETE /api/content/:key
// @access  Private/Admin
const deleteContentByKey = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { language } = req.query;
    
    let query = { content_key: key };
    if (language) {
        query.language = language;
    }
    
    const result = await ContentKeyValue.deleteMany(query);
    
    if (result.deletedCount === 0) {
        return res.status(404).json({
            success: false,
            message: `No content found for key: ${key}`
        });
    }
    
    res.json({
        success: true,
        message: `Deleted ${result.deletedCount} content item(s)`,
        data: { deleted_count: result.deletedCount }
    });
});

// @desc    Search content
// @route   GET /api/content/search
// @access  Private/Admin
const searchContent = asyncHandler(async (req, res) => {
    const { q, language, page, section, type, limit = 50, skip = 0 } = req.query;
    
    let query = { is_active: true };
    
    if (q) {
        query.$text = { $search: q };
    }
    
    if (language) query.language = language;
    if (page) query.page = page;
    if (section) query.section = section;
    if (type) query.type = type;
    
    const content = await ContentKeyValue.find(query)
        .populate("created_by", "name email")
        .populate("updated_by", "name email")
        .sort(q ? { score: { $meta: "textScore" } } : { content_key: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));
    
    const total = await ContentKeyValue.countDocuments(query);
    
    res.json({
        success: true,
        data: content,
        pagination: {
            total,
            limit: parseInt(limit),
            skip: parseInt(skip),
            has_more: total > parseInt(skip) + parseInt(limit)
        }
    });
});

// @desc    Get content statistics
// @route   GET /api/content/stats
// @access  Private/Admin
const getContentStats = asyncHandler(async (req, res) => {
    const stats = await ContentKeyValue.aggregate([
        {
            $group: {
                _id: null,
                total_content: { $sum: 1 },
                english_content: {
                    $sum: { $cond: [{ $eq: ["$language", "en"] }, 1, 0] }
                },
                tamil_content: {
                    $sum: { $cond: [{ $eq: ["$language", "ta"] }, 1, 0] }
                },
                by_type: {
                    $push: {
                        type: "$type",
                        count: 1
                    }
                },
                by_page: {
                    $push: {
                        page: "$page",
                        count: 1
                    }
                }
            }
        }
    ]);
    
    // Get type distribution
    const typeStats = await ContentKeyValue.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    // Get page distribution
    const pageStats = await ContentKeyValue.aggregate([
        { $group: { _id: "$page", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    res.json({
        success: true,
        data: {
            overview: stats[0] || {
                total_content: 0,
                english_content: 0,
                tamil_content: 0
            },
            by_type: typeStats,
            by_page: pageStats
        }
    });
});

// @desc    Get all content keys for a specific page
// @route   GET /api/content/keys/:page
// @access  Private/Admin
const getPageContentKeys = asyncHandler(async (req, res) => {
    const { page } = req.params;
    const { language = "en" } = req.query;
    
    const keys = await ContentKeyValue.find(
        { page, language, is_active: true },
        "content_key section element type last_updated"
    ).sort({ content_key: 1 });
    
    res.json({
        success: true,
        page,
        language,
        data: keys
    });
});

// @desc    Duplicate content from one language to another
// @route   POST /api/content/duplicate
// @access  Private/Admin
const duplicateContent = asyncHandler(async (req, res) => {
    const { from_language, to_language, page, overwrite = false } = req.body;
    
    if (!from_language || !to_language) {
        return res.status(400).json({
            success: false,
            message: "Both from_language and to_language are required"
        });
    }
    
    let query = { language: from_language, is_active: true };
    if (page) query.page = page;
    
    const sourceContent = await ContentKeyValue.find(query);
    
    if (sourceContent.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No source content found"
        });
    }
    
    const operations = [];
    
    for (const item of sourceContent) {
        const duplicateData = {
            content_key: item.content_key,
            content_value: item.content_value,
            language: to_language,
            type: item.type,
            page: item.page,
            section: item.section,
            element: item.element,
            created_by: req.user.id,
            updated_by: req.user.id,
            is_active: true,
            meta_description: item.meta_description,
            alt_text: item.alt_text
        };
        
        if (overwrite) {
            operations.push({
                updateOne: {
                    filter: { content_key: item.content_key, language: to_language },
                    update: duplicateData,
                    upsert: true
                }
            });
        } else {
            operations.push({
                updateOne: {
                    filter: { content_key: item.content_key, language: to_language },
                    update: duplicateData,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            });
        }
    }
    
    const result = await ContentKeyValue.bulkWrite(operations);
    
    res.json({
        success: true,
        message: `Content duplicated from ${from_language} to ${to_language}`,
        data: {
            processed: sourceContent.length,
            modified: result.modifiedCount,
            upserted: result.upsertedCount
        }
    });
});

module.exports = {
    getAllContent,
    getContentByKey,
    bulkUpdateContent,
    updateContentByKey,
    deleteContentByKey,
    searchContent,
    getContentStats,
    getPageContentKeys,
    duplicateContent
};