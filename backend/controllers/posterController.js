const Poster = require('../models/Poster');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

// Get all posters with filtering and pagination
exports.getPosters = async (req, res) => {
    try {
        const {
            q = '',
            active,
            page = 1,
            limit = 10,
            sort = '-createdAt'
        } = req.query;
        
        const query = {};
        
        // Search filter
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { titleTamil: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { descriptionTamil: { $regex: q, $options: 'i' } }
            ];
        }
        
        // Active filter
        if (active !== undefined) {
            if (active === 'true') {
                query.is_active = true;
                query.start_at = { $lte: new Date() };
                query.end_at = { $gte: new Date() };
            } else if (active === 'false') {
                query.$or = [
                    { is_active: false },
                    { start_at: { $gt: new Date() } },
                    { end_at: { $lt: new Date() } }
                ];
            }
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [posters, total] = await Promise.all([
            Poster.find(query)
                .populate('created_by', 'name email')
                .populate('updated_by', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Poster.countDocuments(query)
        ]);
        
        res.json({
            success: true,
            data: posters,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching posters:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching posters',
            error: error.message
        });
    }
};

// Get single poster by ID
exports.getPosterById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const poster = await Poster.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        if (!poster) {
            return res.status(404).json({
                success: false,
                message: 'Poster not found'
            });
        }
        
        res.json({
            success: true,
            data: poster
        });
    } catch (error) {
        console.error('Error fetching poster:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching poster',
            error: error.message
        });
    }
};

// Create new poster
exports.createPoster = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }
        
        const {
            title,
            titleTamil,
            description,
            descriptionTamil,
            imageAlt,
            buttonText,
            buttonTextTamil,
            link_url,
            start_at,
            end_at,
            is_active,
            priority,
            seoTitle,
            seoDescription
        } = req.body;
        
        let image_path = '';
        
        // Handle file upload
        if (req.file) {
            image_path = `/uploads/posters/${req.file.filename}`;
        }
        
        const poster = new Poster({
            title,
            titleTamil,
            description,
            descriptionTamil,
            image_path,
            imageAlt,
            buttonText,
            buttonTextTamil,
            link_url,
            start_at: start_at ? new Date(start_at) : new Date(),
            end_at: end_at ? new Date(end_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            is_active: is_active !== undefined ? is_active : true,
            priority: priority || 0,
            seoTitle,
            seoDescription,
            created_by: req.user.id
        });
        
        await poster.save();
        
        const newPoster = await Poster.findById(poster._id)
            .populate('created_by', 'name email');
        
        res.status(201).json({
            success: true,
            message: 'Poster created successfully',
            data: newPoster
        });
    } catch (error) {
        console.error('Error creating poster:', error);
        
        // Clean up uploaded file if poster creation failed
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating poster',
            error: error.message
        });
    }
};

// Update poster
exports.updatePoster = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }
        
        const { id } = req.params;
        const {
            title,
            titleTamil,
            description,
            descriptionTamil,
            imageAlt,
            buttonText,
            buttonTextTamil,
            link_url,
            start_at,
            end_at,
            is_active,
            priority,
            seoTitle,
            seoDescription
        } = req.body;
        
        const poster = await Poster.findById(id);
        if (!poster) {
            return res.status(404).json({
                success: false,
                message: 'Poster not found'
            });
        }
        
        let oldImagePath = null;
        
        // Handle new file upload
        if (req.file) {
            oldImagePath = poster.image_path;
            poster.image_path = `/uploads/posters/${req.file.filename}`;
        }
        
        // Update fields
        if (title !== undefined) poster.title = title;
        if (titleTamil !== undefined) poster.titleTamil = titleTamil;
        if (description !== undefined) poster.description = description;
        if (descriptionTamil !== undefined) poster.descriptionTamil = descriptionTamil;
        if (imageAlt !== undefined) poster.imageAlt = imageAlt;
        if (buttonText !== undefined) poster.buttonText = buttonText;
        if (buttonTextTamil !== undefined) poster.buttonTextTamil = buttonTextTamil;
        if (link_url !== undefined) poster.link_url = link_url;
        if (start_at !== undefined) poster.start_at = new Date(start_at);
        if (end_at !== undefined) poster.end_at = new Date(end_at);
        if (is_active !== undefined) poster.is_active = is_active;
        if (priority !== undefined) poster.priority = priority;
        if (seoTitle !== undefined) poster.seoTitle = seoTitle;
        if (seoDescription !== undefined) poster.seoDescription = seoDescription;
        
        poster.updated_by = req.user.id;
        
        await poster.save();
        
        // Delete old image if new one was uploaded
        if (oldImagePath && req.file) {
            try {
                const fullOldPath = path.join(__dirname, '../../frontend/public', oldImagePath);
                await fs.unlink(fullOldPath);
            } catch (unlinkError) {
                console.error('Error deleting old image:', unlinkError);
            }
        }
        
        const updatedPoster = await Poster.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        res.json({
            success: true,
            message: 'Poster updated successfully',
            data: updatedPoster
        });
    } catch (error) {
        console.error('Error updating poster:', error);
        
        // Clean up uploaded file if update failed
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating poster',
            error: error.message
        });
    }
};

// Delete poster
exports.deletePoster = async (req, res) => {
    try {
        const { id } = req.params;
        
        const poster = await Poster.findById(id);
        if (!poster) {
            return res.status(404).json({
                success: false,
                message: 'Poster not found'
            });
        }
        
        // Delete associated image file
        if (poster.image_path) {
            try {
                const fullImagePath = path.join(__dirname, '../../frontend/public', poster.image_path);
                await fs.unlink(fullImagePath);
            } catch (unlinkError) {
                console.error('Error deleting image file:', unlinkError);
            }
        }
        
        await Poster.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Poster deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting poster:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting poster',
            error: error.message
        });
    }
};

// Get active posters for public display
exports.getActivePosters = async (req, res) => {
    try {
        const now = new Date();
        
        const posters = await Poster.find({
            is_active: true,
            start_at: { $lte: now },
            end_at: { $gte: now }
        })
        .sort({ priority: -1, createdAt: -1 })
        .select('-created_by -updated_by -seoTitle -seoDescription');
        
        // Increment view count for each poster
        const posterIds = posters.map(p => p._id);
        await Poster.updateMany(
            { _id: { $in: posterIds } },
            { $inc: { viewCount: 1 } }
        );
        
        res.json({
            success: true,
            data: posters
        });
    } catch (error) {
        console.error('Error fetching active posters:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active posters',
            error: error.message
        });
    }
};

// Increment poster click count
exports.incrementClickCount = async (req, res) => {
    try {
        const { id } = req.params;
        
        const poster = await Poster.findById(id);
        if (!poster) {
            return res.status(404).json({
                success: false,
                message: 'Poster not found'
            });
        }
        
        await poster.incrementClickCount();
        
        res.json({
            success: true,
            message: 'Click count updated',
            data: {
                clickCount: poster.clickCount + 1
            }
        });
    } catch (error) {
        console.error('Error incrementing click count:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating click count',
            error: error.message
        });
    }
};

// Get poster statistics
exports.getPosterStats = async (req, res) => {
    try {
        const now = new Date();
        
        const [totalPosters, activePosters, expiredPosters, scheduledPosters] = await Promise.all([
            Poster.countDocuments({}),
            Poster.countDocuments({
                is_active: true,
                start_at: { $lte: now },
                end_at: { $gte: now }
            }),
            Poster.countDocuments({
                end_at: { $lt: now }
            }),
            Poster.countDocuments({
                start_at: { $gt: now }
            })
        ]);
        
        const topPosters = await Poster.find({})
            .sort({ clickCount: -1, viewCount: -1 })
            .limit(5)
            .select('title clickCount viewCount');
        
        res.json({
            success: true,
            data: {
                total: totalPosters,
                active: activePosters,
                expired: expiredPosters,
                scheduled: scheduledPosters,
                topPosters
            }
        });
    } catch (error) {
        console.error('Error fetching poster statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching poster statistics',
            error: error.message
        });
    }
};