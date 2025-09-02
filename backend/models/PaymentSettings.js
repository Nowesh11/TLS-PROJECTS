const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();
const crypto = require('crypto');

const paymentSettingsSchema = new mongoose.Schema({
    gateway: {
        type: String,
        required: true,
        enum: ['stripe', 'paypal', 'fpx', 'razorpay', 'bank_transfer'],
        unique: true
    },
    api_key: {
        type: String,
        required: true
    },
    secret_key: {
        type: String,
        required: true
    },
    webhook_secret: {
        type: String,
        default: ''
    },
    mode: {
        type: String,
        required: true,
        enum: ['test', 'live'],
        default: 'test'
    },
    is_active: {
        type: Boolean,
        default: false
    },
    configuration: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    last_tested_at: {
        type: Date,
        default: null
    },
    test_status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending'
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

// Encryption key - in production, this should be from environment variables
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-cbc';

// Encrypt sensitive data before saving
paymentSettingsSchema.pre('save', function(next) {
    if (this.isModified('api_key') && this.api_key) {
        this.api_key = encrypt(this.api_key);
    }
    if (this.isModified('secret_key') && this.secret_key) {
        this.secret_key = encrypt(this.secret_key);
    }
    if (this.isModified('webhook_secret') && this.webhook_secret) {
        this.webhook_secret = encrypt(this.webhook_secret);
    }
    next();
});

// Decrypt sensitive data after finding
paymentSettingsSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
    if (!docs) return;
    
    const processDoc = (doc) => {
        if (doc.api_key) {
            doc.api_key = decrypt(doc.api_key);
        }
        if (doc.secret_key) {
            doc.secret_key = decrypt(doc.secret_key);
        }
        if (doc.webhook_secret) {
            doc.webhook_secret = decrypt(doc.webhook_secret);
        }
    };
    
    if (Array.isArray(docs)) {
        docs.forEach(processDoc);
    } else {
        processDoc(docs);
    }
});

// Encryption helper functions
function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Indexes
paymentSettingsSchema.index({ gateway: 1 });
paymentSettingsSchema.index({ is_active: 1 });
paymentSettingsSchema.index({ mode: 1 });

// Virtual for masked keys (for display purposes)
paymentSettingsSchema.virtual('api_key_masked').get(function() {
    if (!this.api_key) return '';
    const key = decrypt(this.api_key);
    return key.length > 8 ? key.substring(0, 4) + '****' + key.substring(key.length - 4) : '****';
});

paymentSettingsSchema.virtual('secret_key_masked').get(function() {
    if (!this.secret_key) return '';
    return '****';
});

// Methods
paymentSettingsSchema.methods.activate = async function() {
    // Deactivate all other gateways first
    await this.constructor.updateMany(
        { _id: { $ne: this._id } },
        { is_active: false }
    );
    
    this.is_active = true;
    return this.save();
};

paymentSettingsSchema.methods.deactivate = function() {
    this.is_active = false;
    return this.save();
};

paymentSettingsSchema.methods.testConnection = async function() {
    // This would contain actual gateway testing logic
    this.last_tested_at = new Date();
    this.test_status = 'success'; // This would be determined by actual test
    return this.save();
};

// Static methods
paymentSettingsSchema.statics.getActiveGateway = function() {
    return this.findOne({ is_active: true });
};

paymentSettingsSchema.statics.getByGateway = function(gateway) {
    return this.findOne({ gateway });
};

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);