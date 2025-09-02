const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const projectImageSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: [true, "Project ID is required"]
    },
    file_path: {
        type: String,
        required: [true, "File path is required"],
        trim: true
    },
    is_primary: {
        type: Boolean,
        default: false
    },
    sort_order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for efficient queries
projectImageSchema.index({ project_id: 1, sort_order: 1 });
projectImageSchema.index({ project_id: 1, is_primary: 1 });

// Ensure only one primary image per project
projectImageSchema.pre('save', async function(next) {
    if (this.is_primary && this.isModified('is_primary')) {
        // Remove primary flag from other images of the same project
        await this.constructor.updateMany(
            { 
                project_id: this.project_id, 
                _id: { $ne: this._id } 
            },
            { is_primary: false }
        );
    }
    next();
});

module.exports = mongoose.model("ProjectImage", projectImageSchema);