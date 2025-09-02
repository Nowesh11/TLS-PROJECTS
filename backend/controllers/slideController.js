const Slide = require('../models/Slide');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

// Get all slides with filtering and pagination
exports.getSlides = async (req, res) => {
    try {
        const {
            q = '',
            active,
            page = 1,
            limit = 10,
            sort = 'sort_order'
        } = req.query;
        
        const query = {};
        
        // Search filter
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { subtitle: { $regex: q, $options: 'i' } },
                { cta_text: { $regex: q, $options: 'i' } }
            ];
        }
        
        // Active filter
        if (active !== undefined) {
            query.is_active = active === 'true';
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [slides, total] = await Promise.all([
            Slide.find(query)
                .populate('created_by', 'name email')
                .populate('updated_by', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Slide.countDocuments(query)
        ]);
        
        res.json({
            success: true,
            data: slides,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching slides:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching slides',
            error: error.message
        });
    }
};

// Get single slide by ID
exports.getSlideById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const slide = await Slide.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }
        
        res.json({
            success: true,
            data: slide
        });
    } catch (error) {
        console.error('Error fetching slide:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching slide',
            error: error.message
        });
    }
};

// Create new slide
exports.createSlide = async (req, res) => {
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
            subtitle,
            cta_text,
            cta_link,
            sort_order,
            is_active,
            background_color,
            text_color,
            overlay_opacity,
            animation_type,
            display_duration,
            alt_text
        } = req.body;
        
        let image_path = '';
        let mobile_image_path = '';
        
        // Handle file uploads
        if (req.files) {
            if (req.files.image) {
                image_path = `/uploads/slides/${req.files.image[0].filename}`;
            }
            if (req.files.mobile_image) {
                mobile_image_path = `/uploads/slides/${req.files.mobile_image[0].filename}`;
            }
        }
        
        // Get next sort order if not provided
        let finalSortOrder = sort_order;
        if (!finalSortOrder) {
            finalSortOrder = await Slide.getNextSortOrder();
        }
        
        const slide = new Slide({
            title,
            subtitle,
            image_path,
            cta_text,
            cta_link,
            sort_order: finalSortOrder,
            is_active: is_active !== undefined ? is_active : true,
            background_color: background_color || '#000000',
            text_color: text_color || '#ffffff',
            overlay_opacity: overlay_opacity !== undefined ? overlay_opacity : 0.3,
            animation_type: animation_type || 'fade',
            display_duration: display_duration || 5000,
            mobile_image_path,
            alt_text,
            created_by: req.user.id
        });
        
        await slide.save();
        
        const newSlide = await Slide.findById(slide._id)
            .populate('created_by', 'name email');
        
        res.status(201).json({
            success: true,
            message: 'Slide created successfully',
            data: newSlide
        });
    } catch (error) {
        console.error('Error creating slide:', error);
        
        // Clean up uploaded files if slide creation failed
        if (req.files) {
            try {
                if (req.files.image) {
                    await fs.unlink(req.files.image[0].path);
                }
                if (req.files.mobile_image) {
                    await fs.unlink(req.files.mobile_image[0].path);
                }
            } catch (unlinkError) {
                console.error('Error deleting uploaded files:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating slide',
            error: error.message
        });
    }
};

// Update slide
exports.updateSlide = async (req, res) => {
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
            subtitle,
            cta_text,
            cta_link,
            sort_order,
            is_active,
            background_color,
            text_color,
            overlay_opacity,
            animation_type,
            display_duration,
            alt_text
        } = req.body;
        
        const slide = await Slide.findById(id);
        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }
        
        let oldImagePath = null;
        let oldMobileImagePath = null;
        
        // Handle new file uploads
        if (req.files) {
            if (req.files.image) {
                oldImagePath = slide.image_path;
                slide.image_path = `/uploads/slides/${req.files.image[0].filename}`;
            }
            if (req.files.mobile_image) {
                oldMobileImagePath = slide.mobile_image_path;
                slide.mobile_image_path = `/uploads/slides/${req.files.mobile_image[0].filename}`;
            }
        }
        
        // Update fields
        if (title !== undefined) slide.title = title;
        if (subtitle !== undefined) slide.subtitle = subtitle;
        if (cta_text !== undefined) slide.cta_text = cta_text;
        if (cta_link !== undefined) slide.cta_link = cta_link;
        if (sort_order !== undefined) slide.sort_order = sort_order;
        if (is_active !== undefined) slide.is_active = is_active;
        if (background_color !== undefined) slide.background_color = background_color;
        if (text_color !== undefined) slide.text_color = text_color;
        if (overlay_opacity !== undefined) slide.overlay_opacity = overlay_opacity;
        if (animation_type !== undefined) slide.animation_type = animation_type;
        if (display_duration !== undefined) slide.display_duration = display_duration;
        if (alt_text !== undefined) slide.alt_text = alt_text;
        
        slide.updated_by = req.user.id;
        
        await slide.save();
        
        // Delete old images if new ones were uploaded
        if (oldImagePath && req.files && req.files.image) {
            try {
                const fullOldPath = path.join(__dirname, '../../frontend/public', oldImagePath);
                await fs.unlink(fullOldPath);
            } catch (unlinkError) {
                console.error('Error deleting old image:', unlinkError);
            }
        }
        
        if (oldMobileImagePath && req.files && req.files.mobile_image) {
            try {
                const fullOldPath = path.join(__dirname, '../../frontend/public', oldMobileImagePath);
                await fs.unlink(fullOldPath);
            } catch (unlinkError) {
                console.error('Error deleting old mobile image:', unlinkError);
            }
        }
        
        const updatedSlide = await Slide.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        res.json({
            success: true,
            message: 'Slide updated successfully',
            data: updatedSlide
        });
    } catch (error) {
        console.error('Error updating slide:', error);
        
        // Clean up uploaded files if update failed
        if (req.files) {
            try {
                if (req.files.image) {
                    await fs.unlink(req.files.image[0].path);
                }
                if (req.files.mobile_image) {
                    await fs.unlink(req.files.mobile_image[0].path);
                }
            } catch (unlinkError) {
                console.error('Error deleting uploaded files:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating slide',
            error: error.message
        });
    }
};

// Delete slide
exports.deleteSlide = async (req, res) => {
    try {
        const { id } = req.params;
        
        const slide = await Slide.findById(id);
        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }
        
        // Delete associated image files
        const filesToDelete = [];
        if (slide.image_path) {
            filesToDelete.push(path.join(__dirname, '../../frontend/public', slide.image_path));
        }
        if (slide.mobile_image_path) {
            filesToDelete.push(path.join(__dirname, '../../frontend/public', slide.mobile_image_path));
        }
        
        // Delete files
        for (const filePath of filesToDelete) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.error('Error deleting image file:', unlinkError);
            }
        }
        
        await Slide.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Slide deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting slide:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting slide',
            error: error.message
        });
    }
};

// Get active slides for public display
exports.getActiveSlides = async (req, res) => {
    try {
        const slides = await Slide.getActiveSlides();
        
        // Increment view count for each slide
        const slideIds = slides.map(s => s._id);
        await Slide.updateMany(
            { _id: { $in: slideIds } },
            { $inc: { view_count: 1 } }
        );
        
        res.json({
            success: true,
            data: slides
        });
    } catch (error) {
        console.error('Error fetching active slides:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active slides',
            error: error.message
        });
    }
};

// Increment slide click count
exports.incrementClickCount = async (req, res) => {
    try {
        const { id } = req.params;
        
        const slide = await Slide.findById(id);
        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }
        
        await slide.incrementClickCount();
        
        res.json({
            success: true,
            message: 'Click count updated',
            data: {
                clickCount: slide.click_count + 1
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

// Reorder slides
exports.reorderSlides = async (req, res) => {
    try {
        const { slideOrders } = req.body; // Array of { id, sort_order }
        
        if (!Array.isArray(slideOrders)) {
            return res.status(400).json({
                success: false,
                message: 'slideOrders must be an array'
            });
        }
        
        // Update sort orders
        const updatePromises = slideOrders.map(({ id, sort_order }) => 
            Slide.findByIdAndUpdate(id, { 
                sort_order,
                updated_by: req.user.id 
            })
        );
        
        await Promise.all(updatePromises);
        
        // Get updated slides
        const updatedSlides = await Slide.find({
            _id: { $in: slideOrders.map(s => s.id) }
        }).sort({ sort_order: 1 });
        
        res.json({
            success: true,
            message: 'Slides reordered successfully',
            data: updatedSlides
        });
    } catch (error) {
        console.error('Error reordering slides:', error);
        res.status(500).json({
            success: false,
            message: 'Error reordering slides',
            error: error.message
        });
    }
};

// Get slide statistics
exports.getSlideStats = async (req, res) => {
    try {
        const [totalSlides, activeSlides] = await Promise.all([
            Slide.countDocuments({}),
            Slide.countDocuments({ is_active: true })
        ]);
        
        const popularSlides = await Slide.getPopularSlides(5);
        
        res.json({
            success: true,
            data: {
                total: totalSlides,
                active: activeSlides,
                inactive: totalSlides - activeSlides,
                popularSlides
            }
        });
    } catch (error) {
        console.error('Error fetching slide statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching slide statistics',
            error: error.message
        });
    }
};