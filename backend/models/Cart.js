const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const cartItemSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
        default: 1
    },
    price: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"]
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sessionId: {
        type: String,
        required: function() {
            return !this.user; // Required if no user (guest cart)
        }
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0,
        min: [0, "Total amount cannot be negative"]
    },
    totalItems: {
        type: Number,
        default: 0,
        min: [0, "Total items cannot be negative"]
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Guest carts expire in 7 days, user carts in 30 days
            const days = this.user ? 30 : 7;
            return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true
});

// Index for efficient queries
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Note: Pre-save middleware removed for mock database compatibility
// Total calculations would need to be handled manually in controllers

// Virtual for formatted total
cartSchema.virtual("formattedTotal").get(function() {
    return `RM${this.totalAmount.toFixed(2)}`;
});

module.exports = mongoose.model("Cart", cartSchema);