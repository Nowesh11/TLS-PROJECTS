const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const activityImageSchema = new mongoose.Schema({
    activity_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
        required: [true, "Activity ID is required"]
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
    timestamps: true
});

// Indexes
activityImageSchema.index({ activity_id: 1, sort_order: 1 });
activityImageSchema.index({ activity_id: 1, is_primary: 1 });

// Pre-save hook to ensure only one primary image per activity
activityImageSchema.pre("save", async function(next) {
    if (this.is_primary && this.isModified("is_primary")) {
        // Remove primary flag from other images of the same activity
        await this.constructor.updateMany(
            { 
                activity_id: this.activity_id, 
                _id: { $ne: this._id } 
            },
            { $set: { is_primary: false } }
        );
    }
    next();
});

module.exports = mongoose.model("ActivityImage", activityImageSchema);