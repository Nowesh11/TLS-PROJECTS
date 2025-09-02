const mongoose = require("mongoose");

const projectParticipantSchema = new mongoose.Schema({
    // Project Information
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: [true, "Project reference is required"]
    },
    projectTitle: {
        type: String,
        required: [true, "Project title is required"]
    },
    projectType: {
        type: String,
        enum: ["project", "activity", "initiative"],
        required: [true, "Project type is required"]
    },
    
    // Participant Information
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
    
    // Dynamic Form Data (based on admin-created form)
    formData: {
        type: mongoose.Schema.Types.Mixed, // Flexible object to store any form fields
        default: {}
    },
    
    // Status
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "active", "completed"],
        default: "pending"
    },
    
    // Role in project
    role: {
        type: String,
        enum: ["participant", "volunteer", "crew", "coordinator", "leader"],
        default: "participant"
    },
    
    // User Reference (if logged in)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    // Admin Notes
    adminNotes: {
        type: String,
        maxlength: [1000, "Admin notes cannot exceed 1000 characters"]
    },
    
    // Approval tracking
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    approvedAt: {
        type: Date
    },
    
    // Participation tracking
    joinedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
projectParticipantSchema.index({ project: 1 });
projectParticipantSchema.index({ email: 1 });
projectParticipantSchema.index({ status: 1 });
projectParticipantSchema.index({ projectType: 1 });
projectParticipantSchema.index({ createdAt: -1 });

// Compound index for unique participation
projectParticipantSchema.index({ project: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("ProjectParticipant", projectParticipantSchema);