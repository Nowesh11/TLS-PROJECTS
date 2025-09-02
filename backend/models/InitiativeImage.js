const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const initiativeImageSchema = new mongoose.Schema({
    initiative_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Initiative",
        required: [true, "Initiative ID is required"]
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
initiativeImageSchema.index({ initiative_id: 1, sort_order: 1 });
initiativeImageSchema.index({ initiative_id: 1, is_primary: 1 });

// Pre-save hook to ensure only one primary image per initiative
initiativeImageSchema.pre("save", async function(next) {
    if (this.is_primary && this.isModified("is_primary")) {
        // Remove primary flag from other images of the same initiative
        await this.constructor.updateMany(
            { 
                initiative_id: this.initiative_id, 
                _id: { $ne: this._id } 
            },
            { $set: { is_primary: false } }
        );
    }
    next();
});

module.exports = mongoose.model("InitiativeImage", initiativeImageSchema);