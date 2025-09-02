const Purchase = require("../models/Purchase");
const PaymentSettings = require("../models/PaymentSettings");
const Book = require("../models/Book");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, "../public/uploads/payment-proofs");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "payment-proof-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed for payment proof"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// @desc    Get payment settings
// @route   GET /api/purchases/payment-settings
// @access  Public
const getPaymentSettings = asyncHandler(async (req, res) => {
    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
        // Create default settings if none exist
        settings = await PaymentSettings.create({
            epayUm: {
                enabled: true,
                paymentLink: "https://epayum.com/payment-link",
                instructions: "Click the payment link below to complete your payment via E-PAY UM",
                instructionsTamil: "E-PAY UM மூலம் பணம் செலுத்த கீழே உள்ள இணைப்பைக் கிளிக் செய்யவும்"
            },
            fbx: {
                enabled: true,
                bankName: "Maybank",
                accountNumber: "1234567890",
                accountOwner: "Tamil Language Society",
                instructions: "Transfer the amount to the bank account below and upload your payment proof",
                instructionsTamil: "கீழே உள்ள வங்கி கணக்கில் தொகையை மாற்றி உங்கள் பணம் செலுத்திய ஆதாரத்தை பதிவேற்றவும்"
            }
        });
    }

    res.json({
        success: true,
        data: settings
    });
});

// @desc    Update payment settings
// @route   PUT /api/purchases/payment-settings
// @access  Private/Admin
const updatePaymentSettings = asyncHandler(async (req, res) => {
    let settings = await PaymentSettings.findOne();
    
    const updateData = {
        ...req.body,
        updatedBy: req.user._id
    };

    if (settings) {
        settings = await PaymentSettings.findByIdAndUpdate(
            settings._id,
            updateData,
            { new: true, runValidators: true }
        );
    } else {
        settings = await PaymentSettings.create(updateData);
    }

    res.json({
        success: true,
        data: settings
    });
});

// @desc    Create new purchase
// @route   POST /api/purchases
// @access  Public
const createPurchase = asyncHandler(async (req, res) => {
    const { customerName, customerEmail, customerPhone, books, paymentMethod, notes, shippingAddress } = req.body;

    // Validate books and calculate total
    let totalAmount = 0;
    const purchaseBooks = [];

    for (const bookItem of books) {
        const book = await Book.findById(bookItem.bookId);
        if (!book) {
            res.status(404);
            throw new Error(`Book with ID ${bookItem.bookId} not found`);
        }

        const quantity = bookItem.quantity || 1;
        const bookTotal = book.price * quantity;
        totalAmount += bookTotal;

        purchaseBooks.push({
            bookId: book._id,
            title: book.title,
            price: book.price,
            quantity: quantity
        });
    }

    // Handle payment proof upload
    let paymentProof = {};
    if (req.file) {
        paymentProof = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        };
    }

    const purchase = await Purchase.create({
        customerName,
        customerEmail,
        customerPhone,
        books: purchaseBooks,
        totalAmount,
        paymentMethod,
        paymentProof,
        notes,
        shippingAddress
    });

    res.status(201).json({
        success: true,
        data: purchase
    });
});

// @desc    Get all purchases (Admin)
// @route   GET /api/purchases
// @access  Private/Admin
const getAllPurchases = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, paymentStatus, search } = req.query;

    let query = {};
    
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (search) {
        query.$or = [
            { customerName: { $regex: search, $options: "i" } },
            { customerEmail: { $regex: search, $options: "i" } },
            { orderNumber: { $regex: search, $options: "i" } }
        ];
    }

    const purchases = await Purchase.find(query)
        .populate("books.bookId", "title author")
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(query);

    res.json({
        success: true,
        count: purchases.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: purchases
    });
});

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private/Admin
const getPurchaseById = asyncHandler(async (req, res) => {
    const purchase = await Purchase.findById(req.params.id)
        .populate("books.bookId")
        .populate("verifiedBy", "name email");

    if (!purchase) {
        res.status(404);
        throw new Error("Purchase not found");
    }

    res.json({
        success: true,
        data: purchase
    });
});

// @desc    Update purchase status
// @route   PUT /api/purchases/:id/status
// @access  Private/Admin
const updatePurchaseStatus = asyncHandler(async (req, res) => {
    const { paymentStatus, orderStatus, adminNotes, trackingNumber } = req.body;

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
        res.status(404);
        throw new Error("Purchase not found");
    }

    if (paymentStatus) {
        purchase.paymentStatus = paymentStatus;
        if (paymentStatus === "verified") {
            purchase.verifiedBy = req.user._id;
            purchase.verifiedAt = new Date();
        }
    }

    if (orderStatus) purchase.orderStatus = orderStatus;
    if (adminNotes) purchase.adminNotes = adminNotes;
    if (trackingNumber) purchase.trackingNumber = trackingNumber;

    await purchase.save();

    res.json({
        success: true,
        data: purchase
    });
});

// @desc    Download payment proof
// @route   GET /api/purchases/:id/payment-proof
// @access  Private/Admin
const downloadPaymentProof = asyncHandler(async (req, res) => {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase || !purchase.paymentProof.filename) {
        res.status(404);
        throw new Error("Payment proof not found");
    }

    const filePath = path.join(__dirname, "../public/uploads/payment-proofs", purchase.paymentProof.filename);
    
    if (!fs.existsSync(filePath)) {
        res.status(404);
        throw new Error("Payment proof file not found");
    }

    res.download(filePath, purchase.paymentProof.originalName);
});

// @desc    Export purchases to CSV
// @route   GET /api/purchases/export/csv
// @access  Private/Admin
const exportPurchasesToCSV = asyncHandler(async (req, res) => {
    const { startDate, endDate, status } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    if (status) query.orderStatus = status;

    const purchases = await Purchase.find(query)
        .populate("books.bookId", "title author")
        .sort({ createdAt: -1 });

    // Generate CSV content
    const csvHeader = "Order Number,Customer Name,Customer Email,Books,Total Amount,Payment Method,Payment Status,Order Status,Created Date\n";
    
    const csvRows = purchases.map(purchase => {
        const books = purchase.books.map(book => `${book.title} (Qty: ${book.quantity})`).join("; ");
        return [
            purchase.orderNumber,
            purchase.customerName,
            purchase.customerEmail,
            `"${books}"`,
            purchase.totalAmount,
            purchase.paymentMethod,
            purchase.paymentStatus,
            purchase.orderStatus,
            purchase.createdAt.toISOString().split("T")[0]
        ].join(",");
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=purchases-${Date.now()}.csv`);
    res.send(csvContent);
});

module.exports = {
    upload,
    getPaymentSettings,
    updatePaymentSettings,
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchaseStatus,
    downloadPaymentProof,
    exportPurchasesToCSV
};