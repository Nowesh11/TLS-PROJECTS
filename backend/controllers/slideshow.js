const MediaUpload = require("../models/MediaUpload");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const sharp = require("sharp");

// Configure multer for slideshow image uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../public/uploads/slideshow");
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString("hex");
        const ext = path.extname(file.originalname).toLowerCase();
        const name = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, "_")
            .substring(0, 50);
        cb(null, `slideshow_${name}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (JPEG, PNG, WebP) are allowed for slideshow"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for slideshow images
    }
});

// @desc    Get all slideshow images
// @route   GET /api/slideshow/images
// @access  Public
const getSlideshowImages = asyncHandler(async (req, res) => {
    try {
        const slideshowImages = await MediaUpload.find({
            category: "hero",
            usage_context: "slideshow",
            is_active: true
        })
        .sort({ "metadata.display_order": 1, uploaded_at: 1 })
        .lean();
        // Note: Mock database doesn't support .select() method

        // Format response for frontend
        const formattedImages = slideshowImages.map(image => ({
            id: image._id,
            url: image.file_url,
            alt: image.alt_text || "Slideshow image",
            title: image.title || "",
            dimensions: image.dimensions,
            order: image.metadata?.display_order || 0
        }));

        res.json({
            success: true,
            count: formattedImages.length,
            data: formattedImages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching slideshow images",
            error: error.message
        });
    }
});

// @desc    Upload new slideshow image
// @route   POST /api/slideshow/images
// @access  Private/Admin
const uploadSlideshowImage = asyncHandler(async (req, res) => {
    const uploadSingle = upload.single("image");
    
    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded"
            });
        }

        try {
            const { title, alt_text, display_order = 0 } = req.body;

            // Get image dimensions
            let dimensions = null;
            try {
                const metadata = await sharp(req.file.path).metadata();
                dimensions = {
                    width: metadata.width,
                    height: metadata.height
                };
            } catch (error) {
                console.warn("Could not get image dimensions:", error.message);
            }

            // Create slideshow image record
            const slideshowImage = new MediaUpload({
                file_url: `/uploads/slideshow/${req.file.filename}`,
                original_filename: req.file.originalname,
                filename: req.file.filename,
                alt_text: alt_text || "Slideshow image",
                title: title || "",
                file_type: req.file.mimetype,
                file_size: req.file.size,
                category: "hero",
                usage_context: "slideshow",
                dimensions,
                uploaded_by: req.user._id,
                metadata: {
                    display_order: parseInt(display_order) || 0,
                    slideshow_specific: true
                }
            });

            await slideshowImage.save();

            res.status(201).json({
                success: true,
                message: "Slideshow image uploaded successfully",
                data: {
                    id: slideshowImage._id,
                    url: slideshowImage.file_url,
                    alt: slideshowImage.alt_text,
                    title: slideshowImage.title,
                    dimensions: slideshowImage.dimensions,
                    order: slideshowImage.metadata.display_order
                }
            });
        } catch (error) {
            // Clean up uploaded file if database save fails
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error("Error deleting uploaded file:", unlinkError);
            }

            res.status(500).json({
                success: false,
                message: "Error saving slideshow image",
                error: error.message
            });
        }
    });
});

// @desc    Update slideshow image
// @route   PUT /api/slideshow/images/:id
// @access  Private/Admin
const updateSlideshowImage = asyncHandler(async (req, res) => {
    try {
        const { title, alt_text, display_order, is_active } = req.body;
        
        const slideshowImage = await MediaUpload.findOne({
            _id: req.params.id,
            category: "hero",
            usage_context: "slideshow"
        });

        if (!slideshowImage) {
            return res.status(404).json({
                success: false,
                message: "Slideshow image not found"
            });
        }

        // Update fields
        if (title !== undefined) slideshowImage.title = title;
        if (alt_text !== undefined) slideshowImage.alt_text = alt_text;
        if (is_active !== undefined) slideshowImage.is_active = is_active;
        
        if (display_order !== undefined) {
            slideshowImage.metadata = {
                ...slideshowImage.metadata,
                display_order: parseInt(display_order)
            };
        }

        await slideshowImage.save();

        res.json({
            success: true,
            message: "Slideshow image updated successfully",
            data: {
                id: slideshowImage._id,
                url: slideshowImage.file_url,
                alt: slideshowImage.alt_text,
                title: slideshowImage.title,
                dimensions: slideshowImage.dimensions,
                order: slideshowImage.metadata?.display_order || 0,
                is_active: slideshowImage.is_active
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating slideshow image",
            error: error.message
        });
    }
});

// @desc    Delete slideshow image
// @route   DELETE /api/slideshow/images/:id
// @access  Private/Admin
const deleteSlideshowImage = asyncHandler(async (req, res) => {
    try {
        const slideshowImage = await MediaUpload.findOne({
            _id: req.params.id,
            category: "hero",
            usage_context: "slideshow"
        });

        if (!slideshowImage) {
            return res.status(404).json({
                success: false,
                message: "Slideshow image not found"
            });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, "../public", slideshowImage.file_url);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn("Could not delete file:", error.message);
        }

        // Delete from database
        await MediaUpload.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: "Slideshow image deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting slideshow image",
            error: error.message
        });
    }
});

// @desc    Get slideshow settings
// @route   GET /api/slideshow/settings
// @access  Public
const getSlideshowSettings = asyncHandler(async (req, res) => {
    // For now, return default settings
    // In the future, these could be stored in a database
    const defaultSettings = {
        autoPlay: true,
        interval: 6000,
        showControls: true,
        showIndicators: true,
        pauseOnHover: true,
        transitionDuration: 1500
    };

    res.json({
        success: true,
        data: defaultSettings
    });
});

// @desc    Update slideshow settings
// @route   PUT /api/slideshow/settings
// @access  Private/Admin
const updateSlideshowSettings = asyncHandler(async (req, res) => {
    // For now, just return success
    // In the future, settings could be stored in database
    const { autoPlay, interval, showControls, showIndicators, pauseOnHover, transitionDuration } = req.body;
    
    const settings = {
        autoPlay: autoPlay !== undefined ? autoPlay : true,
        interval: interval || 6000,
        showControls: showControls !== undefined ? showControls : true,
        showIndicators: showIndicators !== undefined ? showIndicators : true,
        pauseOnHover: pauseOnHover !== undefined ? pauseOnHover : true,
        transitionDuration: transitionDuration || 1500
    };

    res.json({
        success: true,
        message: "Slideshow settings updated successfully",
        data: settings
    });
});

// @desc    Reorder slides
// @route   PUT /api/slideshow/reorder
// @access  Private/Admin
const reorderSlides = asyncHandler(async (req, res) => {
    try {
        const { slideOrder } = req.body; // Array of {id, order} objects

        if (!Array.isArray(slideOrder)) {
            return res.status(400).json({
                success: false,
                message: "slideOrder must be an array"
            });
        }

        // Update display order for each slide
        const updatePromises = slideOrder.map(async ({ id, order }) => {
            return MediaUpload.findOneAndUpdate(
                { 
                    _id: id,
                    category: "hero",
                    usage_context: "slideshow"
                },
                { 
                    $set: { 
                        "metadata.display_order": parseInt(order) || 0 
                    }
                },
                { new: true }
            );
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: "Slide order updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error reordering slides",
            error: error.message
        });
    }
});

// @desc    Get page selection for slideshow
// @route   GET /api/slideshow/page-selection
// @access  Private/Admin
const getPageSelection = asyncHandler(async (req, res) => {
    try {
        const settingsPath = path.join(__dirname, "../data/slideshow-page-selection.json");
        
        let pageSelection = { pages: ["home"] }; // Default to home page
        
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, "utf8");
            pageSelection = JSON.parse(data);
        }
        
        res.json({
            success: true,
            ...pageSelection
        });
    } catch (error) {
        console.error("Error loading page selection:", error);
        res.status(500).json({
            success: false,
            message: "Error loading page selection"
        });
    }
});

// @desc    Update page selection for slideshow
// @route   POST /api/slideshow/page-selection
// @access  Private/Admin
const updatePageSelection = asyncHandler(async (req, res) => {
    try {
        const { pages } = req.body;
        
        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one page"
            });
        }
        
        const validPages = ["home", "about", "services", "projects", "contact", "activities"];
        const invalidPages = pages.filter(page => !validPages.includes(page));
        
        if (invalidPages.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid pages: ${invalidPages.join(", ")}`
            });
        }
        
        const pageSelection = { pages };
        const settingsPath = path.join(__dirname, "../data/slideshow-page-selection.json");
        
        // Ensure data directory exists
        const dataDir = path.dirname(settingsPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(settingsPath, JSON.stringify(pageSelection, null, 2));
        
        res.json({
            success: true,
            message: "Page selection updated successfully",
            data: pageSelection
        });
    } catch (error) {
        console.error("Error updating page selection:", error);
        res.status(500).json({
            success: false,
            message: "Error updating page selection"
        });
    }
});

module.exports = {
    getSlideshowImages,
    uploadSlideshowImage,
    updateSlideshowImage,
    deleteSlideshowImage,
    getSlideshowSettings,
    updateSlideshowSettings,
    reorderSlides,
    getPageSelection,
    updatePageSelection
};