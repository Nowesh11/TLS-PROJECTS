const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const slideSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [300, 'Subtitle cannot exceed 300 characters'],
        default: ''
    },
    image_path: {
        type: String,
        required: true
    },
    cta_text: {
        type: String,
        trim: true,
        maxlength: [50, 'CTA text cannot exceed 50 characters'],
        default: ''
    },
    cta_link: {
        type: String,
        trim: true,
        maxlength: [500, 'CTA link cannot exceed 500 characters'],
        default: ''
    },
    sort_order: {
        type: Number,
        required: true,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    background_color: {
        type: String,
        default: '#ffffff'
    },
    text_color: {
        type: String,
        default: '#000000'
    },
    overlay_opacity: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.3
    },
    animation_type: {
        type: String,
        enum: ['fade', 'slide', 'zoom', 'none'],
        default: 'fade'
    },
    display_duration: {
        type: Number,
        default: 5000, // milliseconds
        min: 1000,
        max: 30000
    },
    mobile_image_path: {
        type: String,
        default: ''
    },
    alt_text: {
        type: String,
        trim: true,
        maxlength: [200, 'Alt text cannot exceed 200 characters'],
        default: ''
    },
    click_count: {
        type: Number,
        default: 0
    },
    view_count: {
        type: Number,
        default: 0
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
slideSchema.index({ is_active: 1 });
slideSchema.index({ sort_order: 1 });
slideSchema.index({ created_by: 1 });
slideSchema.index({ createdAt: -1 });

// Virtual for checking if slide has CTA
slideSchema.virtual('has_cta').get(function() {
    return this.cta_text && this.cta_link;
});

// Virtual for responsive image
slideSchema.virtual('responsive_image').get(function() {
    return {
        desktop: this.image_path,
        mobile: this.mobile_image_path || this.image_path
    };
});

// Methods
slideSchema.methods.activate = function() {
    this.is_active = true;
    return this.save();
};

slideSchema.methods.deactivate = function() {
    this.is_active = false;
    return this.save();
};

slideSchema.methods.incrementView = function() {
    this.view_count += 1;
    return this.save();
};

slideSchema.methods.incrementClick = function() {
    this.click_count += 1;
    return this.save();
};

slideSchema.methods.moveUp = async function() {
    const higherSlide = await this.constructor.findOne({
        sort_order: { $gt: this.sort_order },
        is_active: true
    }).sort({ sort_order: 1 });
    
    if (higherSlide) {
        const tempOrder = this.sort_order;
        this.sort_order = higherSlide.sort_order;
        higherSlide.sort_order = tempOrder;
        
        await higherSlide.save();
        return this.save();
    }
    
    return this;
};

slideSchema.methods.moveDown = async function() {
    const lowerSlide = await this.constructor.findOne({
        sort_order: { $lt: this.sort_order },
        is_active: true
    }).sort({ sort_order: -1 });
    
    if (lowerSlide) {
        const tempOrder = this.sort_order;
        this.sort_order = lowerSlide.sort_order;
        lowerSlide.sort_order = tempOrder;
        
        await lowerSlide.save();
        return this.save();
    }
    
    return this;
};

// Static methods
slideSchema.statics.findActive = function() {
    return this.find({ is_active: true })
        .sort({ sort_order: 1, createdAt: 1 });
};

slideSchema.statics.getNextSortOrder = async function() {
    const lastSlide = await this.findOne({}, {}, { sort: { sort_order: -1 } });
    return lastSlide ? lastSlide.sort_order + 1 : 1;
};

slideSchema.statics.reorderSlides = async function(slideIds) {
    const promises = slideIds.map((id, index) => {
        return this.findByIdAndUpdate(id, { sort_order: index + 1 });
    });
    
    return Promise.all(promises);
};

slideSchema.statics.getPopular = function(limit = 5) {
    return this.find({ is_active: true })
        .sort({ click_count: -1, view_count: -1 })
        .limit(limit);
};

// Pre-save middleware to set sort_order if not provided
slideSchema.pre('save', async function(next) {
    if (this.isNew && !this.sort_order) {
        const lastSlide = await this.constructor.findOne({}, {}, { sort: { sort_order: -1 } });
        this.sort_order = lastSlide ? lastSlide.sort_order + 1 : 1;
    }
    next();
});

module.exports = mongoose.model('Slide', slideSchema);