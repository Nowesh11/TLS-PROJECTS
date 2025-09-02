const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
        trim: true,
        maxlength: [100, "Name cannot be more than 100 characters"]
    },
    nameTamil: {
        type: String,
        trim: true,
        maxlength: [100, "Tamil name cannot be more than 100 characters"]
    },
    position: {
        type: String,
        required: [true, "Please add a position"],
        enum: ["president", "vice-president", "treasurer", "secretary", "executive", "auditor"],
        lowercase: true
    },
    department: {
        type: String,
        trim: true,
        maxlength: [100, "Department cannot be more than 100 characters"]
    },
    bio: {
        type: String,
        maxlength: [500, "Bio cannot be more than 500 characters"]
    },
    bioTamil: {
        type: String,
        maxlength: [500, "Tamil bio cannot be more than 500 characters"]
    },
    profilePicture: {
        type: String,
        default: "/assets/default-avatar.jpg"
    },
    photo: {
        type: String,
        default: "/assets/default-avatar.jpg"
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please add a valid email"
        ]
    },
    phone: {
        type: String,
        maxlength: [20, "Phone number cannot be more than 20 characters"]
    },
    order: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    socialLinks: {
        linkedin: String,
        twitter: String,
        facebook: String
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create index for position and order for efficient querying
TeamSchema.index({ position: 1, order: 1 });

// Static method to get hierarchy order
TeamSchema.statics.getHierarchyOrder = function() {
    return {
        "president": 1,
        "vice-president": 2,
        "treasurer": 3,
        "secretary": 4,
        "executive": 5,
        "auditor": 6
    };
};

// Instance method to get position display name
TeamSchema.methods.getPositionDisplayName = function() {
    const displayNames = {
        "president": "President",
        "vice-president": "Vice President",
        "treasurer": "Treasurer",
        "secretary": "Secretary",
        "executive": "Executive Committee Member",
        "auditor": "Auditor"
    };
    return displayNames[this.position] || this.position;
};

module.exports = mongoose.model("Team", TeamSchema);