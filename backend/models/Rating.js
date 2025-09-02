const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"]
    },
    review: {
        type: String,
        maxlength: [1000, "Review cannot exceed 1000 characters"],
        trim: true
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpful: {
        type: Number,
        default: 0,
        min: [0, "Helpful count cannot be negative"]
    },
    status: {
        type: String,
        default: "active",
        enum: ["active", "hidden", "flagged"]
    }
}, {
    timestamps: true
});

// Compound index to ensure one rating per user per book
ratingSchema.index({ user: 1, book: 1 }, { unique: true });

// Index for book ratings
ratingSchema.index({ book: 1, status: 1 });

// Index for user ratings
ratingSchema.index({ user: 1, status: 1 });

// Static method to calculate average rating for a book
ratingSchema.statics.calculateBookRating = async function(bookId) {
    const stats = await this.aggregate([
        {
            $match: {
                book: new mongoose.Types.ObjectId(bookId),
                status: "active"
            }
        },
        {
            $group: {
                _id: "$book",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        const { averageRating, totalRatings } = stats[0];
        
        // Update the book with new rating and review count
        await mongoose.model("Book").findByIdAndUpdate(bookId, {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            reviewCount: totalRatings
        });

        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings
        };
    } else {
        // No ratings found, reset book rating
        await mongoose.model("Book").findByIdAndUpdate(bookId, {
            rating: 0,
            reviewCount: 0
        });

        return {
            averageRating: 0,
            totalRatings: 0
        };
    }
};

// Note: Mongoose middleware hooks removed for mock database compatibility
// Rating calculations would need to be handled manually in controllers

module.exports = mongoose.model("Rating", ratingSchema);