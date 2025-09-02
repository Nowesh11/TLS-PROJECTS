const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const purchasedBookSchema = new mongoose.Schema({
    // User Information
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email"
        ]
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [20, "Phone number cannot exceed 20 characters"]
    },
    
    // Book Information
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: [true, "Book reference is required"]
    },
    bookTitle: {
        type: String,
        required: [true, "Book title is required"]
    },
    bookPrice: {
        type: Number,
        required: [true, "Book price is required"],
        min: [0, "Price cannot be negative"]
    },
    quantity: {
        type: Number,
        default: 1,
        min: [1, "Quantity must be at least 1"]
    },
    totalAmount: {
        type: Number,
        required: [true, "Total amount is required"],
        min: [0, "Total amount cannot be negative"]
    },
    
    // Payment Information
    paymentMethod: {
        type: String,
        required: [true, "Payment method is required"],
        enum: ["E-PAY UM", "FBX", "Bank Transfer"],
        default: "E-PAY UM"
    },
    paymentProof: {
        type: String, // File path to uploaded payment proof PDF
        required: [true, "Payment proof is required"]
    },
    transactionId: {
        type: String,
        trim: true
    },
    
    // Status Tracking
    status: {
        type: String,
        enum: ["pending", "verified", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    verifiedAt: {
        type: Date
    },
    shippedAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    
    // Shipping Information
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: "Malaysia"
        }
    },
    
    // Admin Notes
    adminNotes: {
        type: String,
        maxlength: [1000, "Admin notes cannot exceed 1000 characters"]
    },
    
    // Tracking
    trackingNumber: {
        type: String,
        trim: true
    },
    
    // User Reference (if logged in)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    // Verification
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

// Indexes
purchasedBookSchema.index({ email: 1 });
purchasedBookSchema.index({ status: 1 });
purchasedBookSchema.index({ book: 1 });
purchasedBookSchema.index({ createdAt: -1 });

// Note: Pre-save middleware removed for mock database compatibility
// Total amount calculation would need to be handled manually in controllers

module.exports = mongoose.model("PurchasedBook", purchasedBookSchema);