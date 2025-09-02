const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const imageOptimizer = require("../middleware/imageOptimizer");
const Book = require("../models/Book");
const Rating = require("../models/Rating");
const ErrorResponse = require("../utils/errorResponse");
const translationService = require("../utils/translationService");

// Configure multer for memory storage (we'll process with Sharp)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    }
});

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res, next) => {
    try {
        let query = Book.find();

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
            // Default to active books for public access
            query = query.find({ status: "active" });
        }

        // Filter by featured
        if (req.query.featured) {
            query = query.find({ featured: req.query.featured === "true" });
        }

        // Filter by bestseller
        if (req.query.bestseller) {
            query = query.find({ bestseller: req.query.bestseller === "true" });
        }

        // Filter by new release
        if (req.query.newRelease) {
            query = query.find({ newRelease: req.query.newRelease === "true" });
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
        const total = await Book.countDocuments(query.getQuery());

        query = query.skip(startIndex).limit(limit);

        // Populate creator info
        query = query.populate("createdBy", "name email");

        const books = await query;

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
            count: books.length,
            total,
            pagination,
            data: books
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("updatedBy", "name email");

        if (!book) {
            return next(new ErrorResponse(`Book not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin only)
exports.createBook = async (req, res, next) => {
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

        const book = await Book.create(req.body);

        res.status(201).json({
            success: true,
            data: book
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin only)
exports.updateBook = async (req, res, next) => {
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

        const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!book) {
            return next(new ErrorResponse(`Book not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
exports.deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return next(new ErrorResponse(`Book not found with id of ${req.params.id}`, 404));
        }

        await book.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload book cover image
// @route   POST /api/books/:id/upload-cover
// @access  Private/Admin
exports.uploadBookCover = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            return next(new ErrorResponse("Book not found", 404));
        }

        if (!req.file) {
            return next(new ErrorResponse("Please upload an image file", 400));
        }

        // Clean up old cover image if exists
        if (book.coverImage && book.coverImage !== "/assets/images/default-book.svg") {
            try {
                await imageOptimizer.cleanupOldImages([book.coverImage]);
            } catch (cleanupError) {
                console.warn("Failed to cleanup old cover image:", cleanupError);
            }
        }

        // Process and optimize the cover image
        const processedImage = await imageOptimizer.processBookCover(req.file, book._id);

        // Update book with new cover image path
        book.coverImage = processedImage.path;
        book.responsiveImages = processedImage.responsiveSizes;
        await book.save();

        res.status(200).json({
            success: true,
            message: `Cover image uploaded and optimized (${processedImage.compressionRatio}% compression)`,
            data: book,
            coverImage: processedImage.path,
            responsiveSizes: processedImage.responsiveSizes,
            metadata: processedImage.metadata
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload multiple book images
// @route   POST /api/books/:id/upload-images
// @access  Private/Admin
exports.uploadBookImages = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            return next(new ErrorResponse("Book not found", 404));
        }

        if (!req.files || req.files.length === 0) {
            return next(new ErrorResponse("Please upload at least one image file", 400));
        }

        // Process multiple images
        const processedImages = await imageOptimizer.processBookImages(req.files, book._id);

        if (processedImages.errors.length > 0) {
            console.warn("Some images failed to process:", processedImages.errors);
        }

        // Add new images to existing images array
        const newImagePaths = processedImages.results.map(result => result.path);
        book.images = [...(book.images || []), ...newImagePaths];
        await book.save();

        res.status(200).json({
            success: true,
            message: `${processedImages.processed} images uploaded successfully${processedImages.failed > 0 ? `, ${processedImages.failed} failed` : ""}`,
            data: book,
            images: book.images,
            newImages: newImagePaths,
            processingResults: processedImages.results,
            errors: processedImages.errors
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get book categories
// @route   GET /api/books/categories
// @access  Public
exports.getBookCategories = async (req, res, next) => {
    try {
        const categories = await Book.distinct("category");
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get book statistics
// @route   GET /api/books/stats
// @access  Private (Admin only)
exports.getBookStats = async (req, res, next) => {
    try {
        const stats = await Book.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    avgPrice: { $avg: "$price" },
                    totalValue: { $sum: "$price" }
                }
            }
        ]);

        const categoryStats = await Book.aggregate([
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

        const totalBooks = await Book.countDocuments();
        const featuredBooks = await Book.countDocuments({ featured: true });
        const bestsellers = await Book.countDocuments({ bestseller: true });
        const newReleases = await Book.countDocuments({ newRelease: true });

        res.status(200).json({
            success: true,
            data: {
                totalBooks,
                featuredBooks,
                bestsellers,
                newReleases,
                statusStats: stats,
                categoryStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Purchase book with form submission
// @route   POST /api/books/:id/purchase
// @access  Public
exports.purchaseBook = async (req, res, next) => {
    try {
        const { name, email, paymentMethod, quantity = 1, transactionId } = req.body;
        const bookId = req.params.id;

        // Validate required fields
        if (!name || !email || !paymentMethod) {
            return next(new ErrorResponse("Name, email, and payment method are required", 400));
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return next(new ErrorResponse("Please provide a valid email", 400));
        }

        // Validate payment method
        if (!["epay", "fbx"].includes(paymentMethod.toLowerCase())) {
            return next(new ErrorResponse("Invalid payment method", 400));
        }

        // Check if book exists and is available
        const book = await Book.findById(bookId);
        if (!book) {
            return next(new ErrorResponse(`Book not found with id of ${bookId}`, 404));
        }

        if (book.status !== "active") {
            return next(new ErrorResponse("This book is not available for purchase", 400));
        }

        // Calculate total amount
        const totalAmount = book.price * parseInt(quantity);

        // Handle payment proof file if provided
        let paymentProofPath = null;
        if (req.file) {
            // Validate file type (PDF only)
            if (req.file.mimetype !== "application/pdf") {
                return next(new ErrorResponse("Only PDF files are allowed for payment proof", 400));
            }

            // Save payment proof file
            const uploadPath = "./public/uploads/payment-proofs/";
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const filePath = uploadPath + fileName;

            // Ensure upload directory exists
            const fs = require("fs");
            const path = require("path");
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            // Move the file to the upload directory
            fs.writeFileSync(filePath, req.file.buffer);
            paymentProofPath = `/uploads/payment-proofs/${fileName}`;
        }

        // Create purchase record
        const purchaseData = {
            customerName: name.trim(),
            customerEmail: email.toLowerCase().trim(),
            books: [{
                book: bookId,
                title: book.title,
                titleTamil: book.titleTamil,
                price: book.price,
                quantity: parseInt(quantity)
            }],
            totalAmount,
            paymentMethod: paymentMethod.toLowerCase() === "epay" ? "E-PAY UM" : "FBX",
            paymentStatus: "pending",
            orderStatus: "pending"
        };

        // Add payment proof if provided
        if (paymentProofPath) {
            purchaseData.paymentProof = paymentProofPath;
        }

        // Add transaction ID if provided
        if (transactionId) {
            purchaseData.transactionId = transactionId.trim();
        }

        // Add shipping information if provided
        if (req.body.shippingAddress) {
            try {
                purchaseData.shippingAddress = typeof req.body.shippingAddress === "string" 
                    ? JSON.parse(req.body.shippingAddress) 
                    : req.body.shippingAddress;
            } catch (error) {
                return next(new ErrorResponse("Invalid shipping address format", 400));
            }
        }

        // Add user reference if authenticated
        if (req.user) {
            purchaseData.user = req.user.id;
        }

        const Purchase = require("../models/Purchase");
        const purchase = await Purchase.create(purchaseData);

        res.status(201).json({
            success: true,
            message: "Purchase completed successfully! Your order is being processed.",
            data: {
                orderId: purchase._id,
                orderNumber: purchase.orderNumber,
                book: {
                    id: book._id,
                    title: book.title,
                    titleTamil: book.titleTamil,
                    price: book.price
                },
                totalAmount,
                paymentMethod: purchaseData.paymentMethod,
                status: purchase.orderStatus
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload payment proof for purchase
// @route   POST /api/books/purchase/:orderId/payment-proof
// @access  Public
exports.uploadPaymentProof = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { transactionId } = req.body;

        if (!req.file) {
            return next(new ErrorResponse("Payment proof file is required", 400));
        }

        // Validate file type (PDF only)
        if (req.file.mimetype !== "application/pdf") {
            return next(new ErrorResponse("Only PDF files are allowed for payment proof", 400));
        }

        const Purchase = require("../models/Purchase");
    const purchase = await Purchase.findById(orderId);

        if (!purchase) {
            return next(new ErrorResponse("Purchase order not found", 404));
        }

        if (purchase.status !== "pending") {
            return next(new ErrorResponse("Payment proof already submitted for this order", 400));
        }

        // Update purchase with payment proof
        purchase.paymentProof = req.file.path;
        if (transactionId) {
            purchase.transactionId = transactionId.trim();
        }
        purchase.status = "pending"; // Keep as pending until admin verification

        await purchase.save();

        res.status(200).json({
            success: true,
            message: "Payment proof uploaded successfully. Your order is now being processed.",
            data: {
                orderId: purchase._id,
                status: purchase.status
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Rate a book
// @route   POST /api/books/:id/rate
// @access  Private (Authenticated users only)
exports.rateBook = async (req, res, next) => {
    try {
        const { rating, review } = req.body;
        const bookId = req.params.id;
        const userId = req.user.id;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return next(new ErrorResponse("Rating must be between 1 and 5", 400));
        }

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return next(new ErrorResponse(`Book not found with id of ${bookId}`, 404));
        }

        // Check if user has already rated this book
        let existingRating = await Rating.findOne({ user: userId, book: bookId });

        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            if (review) existingRating.review = review;
            await existingRating.save();
        } else {
            // Create new rating
            existingRating = await Rating.create({
                user: userId,
                book: bookId,
                rating,
                review: review || ""
            });
        }

        res.status(200).json({
            success: true,
            message: "Rating submitted successfully",
            data: existingRating
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get book ratings
// @route   GET /api/books/:id/ratings
// @access  Public
exports.getBookRatings = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return next(new ErrorResponse(`Book not found with id of ${bookId}`, 404));
        }

        // Get ratings with pagination
        const ratings = await Rating.find({ book: bookId, status: "active" })
            .populate("user", "name")
            .sort("-createdAt")
            .skip(startIndex)
            .limit(limit);

        const total = await Rating.countDocuments({ book: bookId, status: "active" });

        // Get rating statistics
        const ratingStats = await Rating.aggregate([
            { $match: { book: new mongoose.Types.ObjectId(bookId), status: "active" } },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        // Pagination result
        const pagination = {};
        const endIndex = page * limit;

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
            count: ratings.length,
            total,
            pagination,
            data: {
                ratings,
                stats: ratingStats,
                averageRating: book.rating,
                totalRatings: book.reviewCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's rating for a book
// @route   GET /api/books/:id/my-rating
// @access  Private (Authenticated users only)
exports.getUserBookRating = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;

        const rating = await Rating.findOne({ user: userId, book: bookId });

        res.status(200).json({
            success: true,
            data: rating
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user's rating for a book
// @route   DELETE /api/books/:id/rating
// @access  Private (Authenticated users only)
exports.deleteUserBookRating = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;

        const rating = await Rating.findOne({ user: userId, book: bookId });

        if (!rating) {
            return next(new ErrorResponse("Rating not found", 404));
        }

        await rating.deleteOne();

        res.status(200).json({
            success: true,
            message: "Rating deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove book cover image
// @route   DELETE /api/books/:id/remove-cover
// @access  Private/Admin
exports.removeCoverImage = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        
        if (!book) {
            return next(new ErrorResponse("Book not found", 404));
        }

        // Clean up old cover image if exists
        if (book.coverImage && book.coverImage !== "/assets/images/default-book.svg") {
            try {
                await imageOptimizer.cleanupOldImages([book.coverImage]);
            } catch (cleanupError) {
                console.warn("Failed to cleanup old cover image:", cleanupError);
            }
        }

        // Reset cover image to default
        book.coverImage = "/assets/images/default-book.svg";
        book.responsiveImages = {};
        await book.save();

        res.status(200).json({
            success: true,
            message: "Cover image removed successfully",
            data: book
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove specific book image
// @route   DELETE /api/books/:id/remove-image/:imageIndex
// @access  Private/Admin
exports.removeBookImage = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        const imageIndex = parseInt(req.params.imageIndex);
        
        if (!book) {
            return next(new ErrorResponse("Book not found", 404));
        }

        if (!book.images || book.images.length === 0) {
            return next(new ErrorResponse("No images found for this book", 400));
        }

        if (imageIndex < 0 || imageIndex >= book.images.length) {
            return next(new ErrorResponse("Invalid image index", 400));
        }

        // Get the image to remove
        const imageToRemove = book.images[imageIndex];

        // Clean up the image file
        if (imageToRemove) {
            try {
                await imageOptimizer.cleanupOldImages([imageToRemove]);
            } catch (cleanupError) {
                console.warn("Failed to cleanup image:", cleanupError);
            }
        }

        // Remove the image from the array
        book.images.splice(imageIndex, 1);
        await book.save();

        res.status(200).json({
            success: true,
            message: "Image removed successfully",
            data: book,
            images: book.images
        });
    } catch (error) {
        next(error);
    }
};