const Ebook = require("../models/Ebook");
const ErrorResponse = require("../utils/errorResponse");
const translationService = require("../utils/translationService");

// @desc    Get all ebooks
// @route   GET /api/ebooks
// @access  Public
exports.getEbooks = async (req, res, next) => {
    try {
        let query = Ebook.find();

        // Search functionality
        if (req.query.search) {
            query = query.find({
                $text: { $search: req.query.search }
            });
        }

        // Filter by category
        if (req.query.category) {
            query = query.find({ category: req.query.category });
        }

        // Filter by status
        if (req.query.status) {
            query = query.find({ status: req.query.status });
        } else {
            // Default to active ebooks for public access
            query = query.find({ status: "active" });
        }

        // Filter by featured
        if (req.query.featured) {
            query = query.find({ featured: req.query.featured === "true" });
        }

        // Filter by free ebooks
        if (req.query.isFree) {
            query = query.find({ isFree: req.query.isFree === "true" });
        }

        // Filter by file format
        if (req.query.format) {
            query = query.find({ fileFormat: req.query.format });
        }

        // Filter by price range
        if (req.query.minPrice || req.query.maxPrice) {
            const priceFilter = {};
            if (req.query.minPrice) priceFilter.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) priceFilter.$lte = parseFloat(req.query.maxPrice);
            query = query.find({ price: priceFilter });
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Ebook.countDocuments(query.getQuery());

        query = query.skip(startIndex).limit(limit);

        // Populate creator info
        query = query.populate("createdBy", "name email");

        const ebooks = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: ebooks.length,
            total,
            pagination,
            data: ebooks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload ebook cover image
// @route   POST /api/ebooks/:id/upload-cover
// @access  Private/Admin
exports.uploadEbookCover = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id);

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        if (!req.file) {
            return next(new ErrorResponse('Please upload a cover image', 400));
        }

        // Create the file URL path
        const coverImageUrl = `/uploads/ebooks/image/${req.file.filename}`;

        // Update ebook with new cover image
        const updatedEbook = await Ebook.findByIdAndUpdate(
            req.params.id,
            { coverImage: coverImageUrl },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                coverImage: updatedEbook.coverImage
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload ebook PDF file
// @route   POST /api/ebooks/:id/upload-file
// @access  Private/Admin
exports.uploadEbookFile = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id);

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        if (!req.file) {
            return next(new ErrorResponse('Please upload an ebook file', 400));
        }

        // Create the file URL path
        const fileUrl = `/uploads/ebooks/file/${req.file.filename}`;
        const fileSize = req.file.size;

        // Update ebook with new file
        const updatedEbook = await Ebook.findByIdAndUpdate(
            req.params.id,
            { 
                fileUrl: fileUrl,
                fileSize: fileSize,
                fileFormat: 'PDF'
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                fileUrl: updatedEbook.fileUrl,
                fileSize: updatedEbook.fileSize,
                fileFormat: updatedEbook.fileFormat
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single ebook
// @route   GET /api/ebooks/:id
// @access  Public
exports.getEbook = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email");

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new ebook
// @route   POST /api/ebooks
// @access  Private (Admin only)
exports.createEbook = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        // Auto-translate English content to Tamil if Tamil fields are empty
        if (req.body.autoTranslate !== false) {
            const translatedFields = await translationService.translateContentObject(req.body);
            
            // Only add translated fields if they don't already exist
            Object.keys(translatedFields).forEach(key => {
                if (!req.body[key] || req.body[key].trim() === "") {
                    req.body[key] = translatedFields[key];
                }
            });
        }

        const ebook = await Ebook.create(req.body);

        res.status(201).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update ebook
// @route   PUT /api/ebooks/:id
// @access  Private (Admin only)
exports.updateEbook = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.updatedBy = req.user.id;

        // Auto-translate English content to Tamil if Tamil fields are empty or auto-translate is requested
        if (req.body.autoTranslate !== false) {
            const translatedFields = await translationService.translateContentObject(req.body);
            
            // Only add translated fields if they don't already exist or are empty
            Object.keys(translatedFields).forEach(key => {
                if (!req.body[key] || req.body[key].trim() === "") {
                    req.body[key] = translatedFields[key];
                }
            });
        }

        const ebook = await Ebook.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete ebook
// @route   DELETE /api/ebooks/:id
// @access  Private (Admin only)
exports.deleteEbook = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id);

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        await ebook.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download ebook
// @route   GET /api/ebooks/:id/download
// @access  Private (Authenticated users only)
exports.downloadEbook = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id);

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        // Check if ebook is free or user has purchased it
        if (!ebook.isFree) {
            // Here you would check if the user has purchased the ebook
            // For now, we'll allow download for authenticated users
        }

        // Check if file exists
        if (!ebook.fileUrl) {
            return next(new ErrorResponse('File not available for download', 404));
        }

        // Increment download count and get updated ebook
        const updatedEbook = await Ebook.findByIdAndUpdate(
            req.params.id, 
            { $inc: { downloadCount: 1 } },
            { new: true }
        );

        const path = require('path');
        const fs = require('fs');
        
        // Construct file path
        const filePath = path.join(__dirname, '..', 'public', ebook.fileUrl);
        
        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            return next(new ErrorResponse('File not found on server', 404));
        }

        // Set appropriate headers for file download
        const filename = `${ebook.title}.${ebook.fileFormat.toLowerCase()}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('X-Download-Count', updatedEbook.downloadCount);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                return next(new ErrorResponse('Error streaming file', 500));
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// @desc    Get ebook download count
// @route   GET /api/ebooks/:id/download-count
// @access  Public
exports.getDownloadCount = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id).select('downloadCount');
        
        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }
        
        res.status(200).json({
            success: true,
            data: {
                downloadCount: ebook.downloadCount || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ebook categories
// @route   GET /api/ebooks/categories
// @access  Public
exports.getEbookCategories = async (req, res, next) => {
    try {
        const categories = await Ebook.distinct("category");
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ebook statistics
// @route   GET /api/ebooks/stats
// @access  Private (Admin only)
exports.getEbookStats = async (req, res, next) => {
    try {
        const stats = await Ebook.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    avgPrice: { $avg: "$price" },
                    totalDownloads: { $sum: "$downloadCount" }
                }
            }
        ]);

        const formatStats = await Ebook.aggregate([
            {
                $group: {
                    _id: "$fileFormat",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const categoryStats = await Ebook.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalEbooks = await Ebook.countDocuments();
        const freeEbooks = await Ebook.countDocuments({ isFree: true });
        const featuredEbooks = await Ebook.countDocuments({ featured: true });
        const totalDownloads = await Ebook.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$downloadCount" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalEbooks,
                freeEbooks,
                featuredEbooks,
                totalDownloads: totalDownloads[0]?.total || 0,
                statusStats: stats,
                formatStats,
                categoryStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Purchase ebook
// @route   POST /api/ebooks/:id/purchase
// @access  Private (Authenticated users only)
exports.purchaseEbook = async (req, res, next) => {
    try {
        const ebook = await Ebook.findById(req.params.id);

        if (!ebook) {
            return next(new ErrorResponse(`Ebook not found with id of ${req.params.id}`, 404));
        }

        if (ebook.status !== "active") {
            return next(new ErrorResponse("This ebook is not available for purchase", 400));
        }

        if (ebook.isFree) {
            return next(new ErrorResponse("This ebook is free and does not require purchase", 400));
        }

        // Here you would typically integrate with a payment processor
        // For now, we'll just simulate a successful purchase
        
        res.status(200).json({
            success: true,
            message: "Ebook purchased successfully",
            data: {
                ebook: {
                    id: ebook._id,
                    title: ebook.title,
                    price: ebook.price,
                    format: ebook.fileFormat
                },
                purchasedBy: req.user.id,
                purchaseDate: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};