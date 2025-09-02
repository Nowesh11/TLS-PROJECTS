const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Book title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    titleTamil: {
        type: String,
        trim: true,
        maxlength: [200, "Tamil title cannot exceed 200 characters"]
    },
    author: {
        type: String,
        required: [true, "Author name is required"],
        trim: true,
        maxlength: [100, "Author name cannot exceed 100 characters"]
    },
    authorTamil: {
        type: String,
        trim: true,
        maxlength: [100, "Tamil author name cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Book description is required"],
        maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    descriptionTamil: {
        type: String,
        maxlength: [2000, "Tamil description cannot exceed 2000 characters"]
    },
    category: {
        type: String,
        required: [true, "Book category is required"],
        enum: ["poetry", "literature", "history", "culture", "language", "children", "academic", "fiction", "non-fiction", "biography", "education", "other"]
    },
    price: {
        type: Number,
        required: [true, "Book price is required"],
        min: [0, "Price cannot be negative"]
    },
    originalPrice: {
        type: Number,
        min: [0, "Original price cannot be negative"]
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, "Discount cannot be negative"],
        max: [100, "Discount cannot exceed 100%"]
    },
    isbn: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    publisher: {
        type: String,
        trim: true,
        maxlength: [100, "Publisher name cannot exceed 100 characters"]
    },
    publishedDate: {
        type: Date
    },
    pages: {
        type: Number,
        min: [1, "Pages must be at least 1"]
    },
    bookLanguage: {
        type: String,
        default: "Tamil",
        enum: ["Tamil", "English", "Bilingual"]
    },
    coverImage: {
        type: String,
        default: "/assets/images/default-book.svg"
    },
    responsiveImages: {
        _thumb: String,
        _small: String,
        _medium: String,
        _large: String
    },
    images: [{
        type: String
    }],
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: [0, "Stock quantity cannot be negative"]
    },
    featured: {
        type: Boolean,
        default: false
    },
    bestseller: {
        type: Boolean,
        default: false
    },
    newRelease: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be negative"],
        max: [5, "Rating cannot exceed 5"]
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, "Review count cannot be negative"]
    },
    tags: [{
        type: String,
        trim: true
    }],
    weight: {
        type: Number,
        min: [0, "Weight cannot be negative"]
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    status: {
        type: String,
        default: "active",
        enum: ["active", "inactive", "out-of-stock", "discontinued"]
    },
    seoTitle: {
        type: String,
        maxlength: [60, "SEO title cannot exceed 60 characters"]
    },
    seoDescription: {
        type: String,
        maxlength: [160, "SEO description cannot exceed 160 characters"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for discounted price
bookSchema.virtual("discountedPrice").get(function() {
    if (this.discount > 0) {
        return this.price * (1 - this.discount / 100);
    }
    return this.price;
});

// Virtual for savings amount
bookSchema.virtual("savings").get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return this.originalPrice - this.price;
    }
    if (this.discount > 0) {
        return this.price * (this.discount / 100);
    }
    return 0;
});

// Index for search functionality
bookSchema.index({
    title: "text",
    titleTamil: "text",
    author: "text",
    authorTamil: "text",
    description: "text",
    descriptionTamil: "text",
    tags: "text"
}, {
    default_language: "none"
});

// Index for category and status
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ featured: 1, status: 1 });
bookSchema.index({ bestseller: 1, status: 1 });
bookSchema.index({ newRelease: 1, status: 1 });

module.exports = mongoose.model("Book", bookSchema);