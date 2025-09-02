const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const purchaseSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    transaction_id: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'MYR', 'SGD', 'INR']
    },
    status: {
        type: String,
        required: true,
        enum: ['paid', 'pending', 'refunded', 'cancelled'],
        default: 'pending'
    },
    purchased_at: {
        type: Date,
        default: Date.now
    },
    delivered_at: {
        type: Date,
        default: null
    },
    refunded_at: {
        type: Date,
        default: null
    },
    refund_reason: {
        type: String,
        default: null
    },
    payment_method: {
        type: String,
        enum: ['stripe', 'paypal', 'fpx', 'bank_transfer'],
        default: 'stripe'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for better query performance
purchaseSchema.index({ user_id: 1 });
purchaseSchema.index({ book_id: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ purchased_at: -1 });
purchaseSchema.index({ transaction_id: 1 });

// Virtual for purchase details
purchaseSchema.virtual('is_delivered').get(function() {
    return this.delivered_at !== null;
});

purchaseSchema.virtual('is_refunded').get(function() {
    return this.status === 'refunded';
});

// Methods
purchaseSchema.methods.markAsDelivered = function() {
    this.delivered_at = new Date();
    return this.save();
};

purchaseSchema.methods.refund = function(reason = '') {
    this.status = 'refunded';
    this.refunded_at = new Date();
    this.refund_reason = reason;
    return this.save();
};

// Static methods
purchaseSchema.statics.findByUser = function(userId) {
    return this.find({ user_id: userId })
        .populate('book_id', 'title author price cover_image_path')
        .sort({ purchased_at: -1 });
};

purchaseSchema.statics.findByStatus = function(status) {
    return this.find({ status })
        .populate('user_id', 'name email')
        .populate('book_id', 'title author price cover_image_path')
        .sort({ purchased_at: -1 });
};

module.exports = mongoose.model('Purchase', purchaseSchema);