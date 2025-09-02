const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const initiativeSchema = new mongoose.Schema({
    title_en: {
        type: String,
        required: [true, "English title is required"],
        trim: true,
        maxlength: [200, "English title cannot exceed 200 characters"]
    },
    title_ta: {
        type: String,
        trim: true,
        maxlength: [200, "Tamil title cannot exceed 200 characters"]
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [100, "Slug cannot exceed 100 characters"]
    },
    bureau: {
        type: String,
        required: [true, "Bureau is required"],
        enum: [
            "media-public-relations",
            "sports-leadership", 
            "education-intellectual",
            "arts-culture",
            "social-welfare-voluntary",
            "language-literature"
        ]
    },
    description_en: {
        type: String,
        required: [true, "English description is required"],
        maxlength: [3000, "English description cannot exceed 3000 characters"]
    },
    description_ta: {
        type: String,
        maxlength: [3000, "Tamil description cannot exceed 3000 characters"]
    },
    director_name: {
        type: String,
        required: [true, "Director name is required"],
        trim: true,
        maxlength: [100, "Director name cannot exceed 100 characters"]
    },
    director_email: {
        type: String,
        required: [true, "Director email is required"],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
    },
    director_phone: {
        type: String,
        trim: true,
        maxlength: [20, "Director phone cannot exceed 20 characters"]
    },
    status: {
        type: String,
        required: [true, "Initiative status is required"],
        enum: ["draft", "active", "archived"],
        default: "draft"
    },
    primary_image_url: {
        type: String,
        default: null
    },
    images_count: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtuals
initiativeSchema.virtual("primaryImage").get(function() {
    return this.primary_image_url || "/assets/default-initiative.jpg";
});

initiativeSchema.virtual("imagesCount").get(function() {
    return this.images_count || 0;
});

initiativeSchema.virtual("images", {
    ref: "InitiativeImage",
    localField: "_id",
    foreignField: "initiative_id"
});

// Indexes
initiativeSchema.index({ title_en: "text", title_ta: "text", description_en: "text", description_ta: "text", director_name: "text" });
initiativeSchema.index({ bureau: 1 });
initiativeSchema.index({ status: 1 });
initiativeSchema.index({ slug: 1 });
initiativeSchema.index({ createdAt: 1 });
initiativeSchema.index({ updatedAt: 1 });

// Pre-save middleware to generate slug
initiativeSchema.pre("save", function(next) {
    if (this.isModified("title_en") || this.isNew) {
        this.slug = this.title_en
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim("-");
    }
    next();
});

module.exports = mongoose.model("Initiative", initiativeSchema);