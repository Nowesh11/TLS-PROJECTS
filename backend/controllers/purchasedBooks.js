const PurchasedBook = require("../models/PurchasedBook");
const Book = require("../models/Book");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all purchased books
// @route   GET /api/purchased-books
// @access  Private (Admin only)
exports.getPurchasedBooks = async (req, res, next) => {
    try {
        let query = PurchasedBook.find();

        // Filter by status
        if (req.query.status) {
            query = query.find({ status: req.query.status });
        }

        // Filter by payment method
        if (req.query.paymentMethod) {
            query = query.find({ paymentMethod: req.query.paymentMethod });
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            query = query.find({
                createdAt: {
                    $gte: new Date(req.query.startDate),
                    $lte: new Date(req.query.endDate)
                }
            });
        }

        // Sort by creation date (newest first)
        query = query.sort("-createdAt");

        // Populate references
        query = query.populate("book", "title titleTamil price image")
                     .populate("user", "name email");

        const purchasedBooks = await query;

        res.status(200).json({
            success: true,
            count: purchasedBooks.length,
            data: purchasedBooks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single purchased book
// @route   GET /api/purchased-books/:id
// @access  Private (Admin only)
exports.getPurchasedBook = async (req, res, next) => {
    try {
        const purchasedBook = await PurchasedBook.findById(req.params.id)
            .populate("book", "title titleTamil price image description")
            .populate("user", "name email phone");

        if (!purchasedBook) {
            return next(new ErrorResponse(`Purchased book not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: purchasedBook
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new purchased book
// @route   POST /api/purchased-books
// @access  Public
exports.createPurchasedBook = async (req, res, next) => {
    try {
        const { bookId, paymentMethod, paymentProof, shippingAddress } = req.body;

        // Validate book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return next(new ErrorResponse("Book not found", 404));
        }

        // Create purchased book record
        const purchasedBookData = {
            book: bookId,
            bookTitle: book.title,
            bookPrice: book.price,
            paymentMethod,
            paymentProof,
            shippingAddress,
            ...req.body
        };

        // If user is authenticated, link to user
        if (req.user) {
            purchasedBookData.user = req.user.id;
        }

        const purchasedBook = await PurchasedBook.create(purchasedBookData);

        // Populate the response
        await purchasedBook.populate("book", "title titleTamil price image");
        if (purchasedBook.user) {
            await purchasedBook.populate("user", "name email");
        }

        res.status(201).json({
            success: true,
            data: purchasedBook
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

// @desc    Update purchased book
// @route   PUT /api/purchased-books/:id
// @access  Private (Admin only)
exports.updatePurchasedBook = async (req, res, next) => {
    try {
        const purchasedBook = await PurchasedBook.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate("book", "title titleTamil price image")
         .populate("user", "name email");

        if (!purchasedBook) {
            return next(new ErrorResponse(`Purchased book not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: purchasedBook
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete purchased book
// @route   DELETE /api/purchased-books/:id
// @access  Private (Admin only)
exports.deletePurchasedBook = async (req, res, next) => {
    try {
        const purchasedBook = await PurchasedBook.findById(req.params.id);

        if (!purchasedBook) {
            return next(new ErrorResponse(`Purchased book not found with id of ${req.params.id}`, 404));
        }

        await purchasedBook.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update book purchase status
// @route   PUT /api/purchased-books/:id/status
// @access  Private (Admin only)
exports.updateBookStatus = async (req, res, next) => {
    try {
        const { status, adminNotes, trackingNumber } = req.body;

        const updateData = { status };
        if (adminNotes) updateData.adminNotes = adminNotes;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;

        // Set processed date when status changes to processed
        if (status === "processed") {
            updateData.processedAt = new Date();
        }

        const purchasedBook = await PurchasedBook.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate("book", "title titleTamil price image")
         .populate("user", "name email");

        if (!purchasedBook) {
            return next(new ErrorResponse(`Purchased book not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: purchasedBook
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export purchased books to CSV
// @route   GET /api/purchased-books/export
// @access  Private (Admin only)
exports.exportPurchasedBooks = async (req, res, next) => {
    try {
        const purchasedBooks = await PurchasedBook.find()
            .populate("book", "title titleTamil price")
            .populate("user", "name email phone")
            .sort("-createdAt");

        // Convert to CSV format
        const csvHeaders = [
            "ID", "Customer Name", "Email", "Phone", "Book Title", "Book Price",
            "Payment Method", "Status", "Transaction ID", "Tracking Number",
            "Shipping Address", "Order Date", "Processed Date", "Admin Notes"
        ];

        const csvData = purchasedBooks.map(purchase => [
            purchase._id,
            purchase.customerName || (purchase.user ? purchase.user.name : ""),
            purchase.customerEmail || (purchase.user ? purchase.user.email : ""),
            purchase.customerPhone || (purchase.user ? purchase.user.phone : ""),
            purchase.book ? purchase.book.title : purchase.bookTitle,
            purchase.bookPrice,
            purchase.paymentMethod,
            purchase.status,
            purchase.transactionId || "",
            purchase.trackingNumber || "",
            purchase.shippingAddress ? JSON.stringify(purchase.shippingAddress) : "",
            purchase.createdAt.toISOString().split("T")[0],
            purchase.processedAt ? purchase.processedAt.toISOString().split("T")[0] : "",
            purchase.adminNotes || ""
        ]);

        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(","))
            .join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=purchased-books.csv");
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

// @desc    Get purchased books statistics
// @route   GET /api/purchased-books/stats
// @access  Private (Admin only)
exports.getPurchasedBooksStats = async (req, res, next) => {
    try {
        const totalOrders = await PurchasedBook.countDocuments();
        const pendingOrders = await PurchasedBook.countDocuments({ status: "pending" });
        const processedOrders = await PurchasedBook.countDocuments({ status: "processed" });
        const shippedOrders = await PurchasedBook.countDocuments({ status: "shipped" });
        const deliveredOrders = await PurchasedBook.countDocuments({ status: "delivered" });

        // Revenue statistics
        const revenueStats = await PurchasedBook.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$bookPrice" },
                    averageOrderValue: { $avg: "$bookPrice" }
                }
            }
        ]);

        // Payment method statistics
        const paymentMethodStats = await PurchasedBook.aggregate([
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    revenue: { $sum: "$bookPrice" }
                }
            }
        ]);

        // Monthly order statistics
        const monthlyStats = await PurchasedBook.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    orders: { $sum: 1 },
                    revenue: { $sum: "$bookPrice" }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processedOrders,
                shippedOrders,
                deliveredOrders,
                totalRevenue: revenueStats[0]?.totalRevenue || 0,
                averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
                paymentMethodStats,
                monthlyStats
            }
        });
    } catch (error) {
        next(error);
    }
};