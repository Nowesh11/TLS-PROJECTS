const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const websiteContentSectionSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: [true, "Page name is required"],
    trim: true,
    maxlength: [100, "Page name cannot exceed 100 characters"],
    index: true
  },
  sectionId: {
    type: String,
    required: [true, "Section ID is required"],
    trim: true,
    maxlength: [100, "Section ID cannot exceed 100 characters"],
    index: true
  },
  sectionTitle: {
    type: String,
    trim: true,
    maxlength: [255, "Section title cannot exceed 255 characters"]
  },
  contentHtml: {
    type: String,
    required: [true, "Content HTML is required"]
  },
  contentTamil: {
    type: String,
    default: ""
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  layout: {
    type: String,
    enum: ["default", "hero", "features", "gallery", "testimonials", "contact", "footer"],
    default: "default"
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  styling: {
    backgroundColor: String,
    textColor: String,
    customCSS: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

// Compound index for efficient querying by page and section
websiteContentSectionSchema.index({ pageName: 1, sectionId: 1 }, { unique: true });

// Index for ordering sections within a page
websiteContentSectionSchema.index({ pageName: 1, order: 1 });

// Index for active and visible content
websiteContentSectionSchema.index({ pageName: 1, isActive: 1, isVisible: 1 });

// Virtual for last updated (using updatedAt from timestamps)
websiteContentSectionSchema.virtual("lastUpdated").get(function() {
  return this.updatedAt;
});

// Method to get formatted section data
websiteContentSectionSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    sectionId: this.sectionId,
    sectionTitle: this.sectionTitle,
    contentHtml: this.contentHtml,
    contentTamil: this.contentTamil,
    order: this.order,
    layout: this.layout,
    isActive: this.isActive,
    isVisible: this.isVisible,
    lastUpdated: this.updatedAt
  };
};

// Static method to get all sections for a page
websiteContentSectionSchema.statics.getPageSections = function(pageName, includeInactive = false) {
  const query = { pageName };
  if (!includeInactive) {
    query.isActive = true;
    query.isVisible = true;
  }
  return this.find(query).sort({ order: 1 });
};

// Static method to update or create a section
websiteContentSectionSchema.statics.updateOrCreateSection = function(pageName, sectionId, updateData) {
  return this.findOneAndUpdate(
    { pageName, sectionId },
    { ...updateData, updatedAt: new Date() },
    { new: true, upsert: true, runValidators: true }
  );
};

module.exports = mongoose.model("WebsiteContentSection", websiteContentSectionSchema);