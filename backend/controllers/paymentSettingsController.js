const PaymentSettings = require('../models/PaymentSettings');
const { validationResult } = require('express-validator');

// Get all payment settings
exports.getPaymentSettings = async (req, res) => {
    try {
        const settings = await PaymentSettings.find({})
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email')
            .sort({ createdAt: -1 });
        
        // Return masked keys for security
        const maskedSettings = settings.map(setting => ({
            ...setting.toObject(),
            api_key: setting.api_key_masked,
            secret_key: setting.secret_key_masked,
            webhook_secret: '****'
        }));
        
        res.json({
            success: true,
            data: maskedSettings
        });
    } catch (error) {
        console.error('Error fetching payment settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment settings',
            error: error.message
        });
    }
};

// Get single payment setting by ID
exports.getPaymentSettingById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const setting = await PaymentSettings.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Payment setting not found'
            });
        }
        
        // Return with masked keys
        const maskedSetting = {
            ...setting.toObject(),
            api_key: setting.api_key_masked,
            secret_key: setting.secret_key_masked,
            webhook_secret: '****'
        };
        
        res.json({
            success: true,
            data: maskedSetting
        });
    } catch (error) {
        console.error('Error fetching payment setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment setting',
            error: error.message
        });
    }
};

// Create new payment setting
exports.createPaymentSetting = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }
        
        const {
            gateway,
            api_key,
            secret_key,
            webhook_secret,
            mode,
            is_active,
            configuration
        } = req.body;
        
        // Check if gateway already exists
        const existingSetting = await PaymentSettings.findOne({ gateway });
        if (existingSetting) {
            return res.status(400).json({
                success: false,
                message: `Payment setting for ${gateway} already exists`
            });
        }
        
        const paymentSetting = new PaymentSettings({
            gateway,
            api_key,
            secret_key,
            webhook_secret: webhook_secret || '',
            mode,
            is_active: is_active || false,
            configuration: configuration || {},
            created_by: req.user.id
        });
        
        await paymentSetting.save();
        
        // If this setting is set to active, deactivate others
        if (is_active) {
            await paymentSetting.activate();
        }
        
        const newSetting = await PaymentSettings.findById(paymentSetting._id)
            .populate('created_by', 'name email');
        
        // Return with masked keys
        const maskedSetting = {
            ...newSetting.toObject(),
            api_key: newSetting.api_key_masked,
            secret_key: newSetting.secret_key_masked,
            webhook_secret: '****'
        };
        
        res.status(201).json({
            success: true,
            message: 'Payment setting created successfully',
            data: maskedSetting
        });
    } catch (error) {
        console.error('Error creating payment setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment setting',
            error: error.message
        });
    }
};

// Update payment setting
exports.updatePaymentSetting = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }
        
        const { id } = req.params;
        const {
            api_key,
            secret_key,
            webhook_secret,
            mode,
            is_active,
            configuration
        } = req.body;
        
        const setting = await PaymentSettings.findById(id);
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Payment setting not found'
            });
        }
        
        // Update fields
        if (api_key) setting.api_key = api_key;
        if (secret_key) setting.secret_key = secret_key;
        if (webhook_secret !== undefined) setting.webhook_secret = webhook_secret;
        if (mode) setting.mode = mode;
        if (configuration) setting.configuration = configuration;
        setting.updated_by = req.user.id;
        
        // Handle activation
        if (is_active !== undefined) {
            if (is_active) {
                await setting.activate();
            } else {
                await setting.deactivate();
            }
        } else {
            await setting.save();
        }
        
        const updatedSetting = await PaymentSettings.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        // Return with masked keys
        const maskedSetting = {
            ...updatedSetting.toObject(),
            api_key: updatedSetting.api_key_masked,
            secret_key: updatedSetting.secret_key_masked,
            webhook_secret: '****'
        };
        
        res.json({
            success: true,
            message: 'Payment setting updated successfully',
            data: maskedSetting
        });
    } catch (error) {
        console.error('Error updating payment setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment setting',
            error: error.message
        });
    }
};

// Delete payment setting
exports.deletePaymentSetting = async (req, res) => {
    try {
        const { id } = req.params;
        
        const setting = await PaymentSettings.findById(id);
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Payment setting not found'
            });
        }
        
        // Don't allow deletion of active gateway
        if (setting.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete active payment gateway. Please deactivate first.'
            });
        }
        
        await PaymentSettings.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Payment setting deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment setting:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting payment setting',
            error: error.message
        });
    }
};

// Activate payment gateway
exports.activateGateway = async (req, res) => {
    try {
        const { id } = req.params;
        
        const setting = await PaymentSettings.findById(id);
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Payment setting not found'
            });
        }
        
        await setting.activate();
        
        const updatedSetting = await PaymentSettings.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        res.json({
            success: true,
            message: `${setting.gateway} gateway activated successfully`,
            data: {
                ...updatedSetting.toObject(),
                api_key: updatedSetting.api_key_masked,
                secret_key: updatedSetting.secret_key_masked,
                webhook_secret: '****'
            }
        });
    } catch (error) {
        console.error('Error activating gateway:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating payment gateway',
            error: error.message
        });
    }
};

// Deactivate payment gateway
exports.deactivateGateway = async (req, res) => {
    try {
        const { id } = req.params;
        
        const setting = await PaymentSettings.findById(id);
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Payment setting not found'
            });
        }
        
        await setting.deactivate();
        
        const updatedSetting = await PaymentSettings.findById(id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');
        
        res.json({
            success: true,
            message: `${setting.gateway} gateway deactivated successfully`,
            data: {
                ...updatedSetting.toObject(),
                api_key: updatedSetting.api_key_masked,
                secret_key: updatedSetting.secret_key_masked,
                webhook_secret: '****'
            }
        });
    } catch (error) {
        console.error('Error deactivating gateway:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating payment gateway',
            error: error.message
        });
    }
};

// Test payment gateway connection
exports.testGateway = async (req, res) => {
    try {
        const { id } = req.params;
        
        const setting = await PaymentSettings.findById(id);
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Payment setting not found'
            });
        }
        
        // This would contain actual gateway testing logic
        // For now, we'll just update the test status
        await setting.testConnection();
        
        res.json({
            success: true,
            message: `${setting.gateway} gateway test completed`,
            data: {
                gateway: setting.gateway,
                test_status: setting.test_status,
                last_tested_at: setting.last_tested_at
            }
        });
    } catch (error) {
        console.error('Error testing gateway:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing payment gateway',
            error: error.message
        });
    }
};

// Get active payment gateway (for public use)
exports.getActiveGateway = async (req, res) => {
    try {
        const activeGateway = await PaymentSettings.getActiveGateway();
        
        if (!activeGateway) {
            return res.status(404).json({
                success: false,
                message: 'No active payment gateway found'
            });
        }
        
        // Return only necessary public information
        res.json({
            success: true,
            data: {
                gateway: activeGateway.gateway,
                mode: activeGateway.mode,
                configuration: activeGateway.configuration
            }
        });
    } catch (error) {
        console.error('Error fetching active gateway:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active payment gateway',
            error: error.message
        });
    }
};