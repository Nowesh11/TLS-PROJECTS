const PaymentSettings = require('../models/PaymentSettings');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all payment gateways
// @route   GET /api/payment-settings
// @access  Private (Admin only)
exports.getPaymentGateways = async (req, res, next) => {
    try {
        const gateways = await PaymentSettings.find()
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const stats = {
            total: gateways.length,
            active: gateways.filter(g => g.is_active).length,
            testMode: gateways.filter(g => g.mode === 'test').length
        };

        res.status(200).json({
            success: true,
            data: {
                gateways,
                stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single payment gateway
// @route   GET /api/payment-settings/:id
// @access  Private (Admin only)
exports.getPaymentGateway = async (req, res, next) => {
    try {
        const gateway = await PaymentSettings.findById(req.params.id)
            .populate('created_by', 'name email')
            .populate('updated_by', 'name email');

        if (!gateway) {
            return next(new ErrorResponse('Payment gateway not found', 404));
        }

        res.status(200).json({
            success: true,
            data: gateway
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create payment gateway
// @route   POST /api/payment-settings
// @access  Private (Admin only)
exports.createPaymentGateway = async (req, res, next) => {
    try {
        req.body.created_by = req.user.id;
        
        const gateway = await PaymentSettings.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Payment gateway created successfully',
            data: gateway
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new ErrorResponse('Gateway already exists', 400));
        }
        next(error);
    }
};

// @desc    Update payment gateway
// @route   PUT /api/payment-settings/:id
// @access  Private (Admin only)
exports.updatePaymentGateway = async (req, res, next) => {
    try {
        req.body.updated_by = req.user.id;

        const gateway = await PaymentSettings.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!gateway) {
            return next(new ErrorResponse('Payment gateway not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Payment gateway updated successfully',
            data: gateway
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete payment gateway
// @route   DELETE /api/payment-settings/:id
// @access  Private (Admin only)
exports.deletePaymentGateway = async (req, res, next) => {
    try {
        const gateway = await PaymentSettings.findById(req.params.id);

        if (!gateway) {
            return next(new ErrorResponse('Payment gateway not found', 404));
        }

        await gateway.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Payment gateway deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Activate payment gateway
// @route   PUT /api/payment-settings/:id/activate
// @access  Private (Admin only)
exports.activateGateway = async (req, res, next) => {
    try {
        const gateway = await PaymentSettings.findById(req.params.id);

        if (!gateway) {
            return next(new ErrorResponse('Payment gateway not found', 404));
        }

        await gateway.activate();

        res.status(200).json({
            success: true,
            message: 'Payment gateway activated successfully',
            data: gateway
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deactivate payment gateway
// @route   PUT /api/payment-settings/:id/deactivate
// @access  Private (Admin only)
exports.deactivateGateway = async (req, res, next) => {
    try {
        const gateway = await PaymentSettings.findById(req.params.id);

        if (!gateway) {
            return next(new ErrorResponse('Payment gateway not found', 404));
        }

        gateway.deactivate();
        await gateway.save();

        res.status(200).json({
            success: true,
            message: 'Payment gateway deactivated successfully',
            data: gateway
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Test payment gateway connection
// @route   POST /api/payment-settings/:id/test
// @access  Private (Admin only)
exports.testGateway = async (req, res, next) => {
    try {
        const gateway = await PaymentSettings.findById(req.params.id);

        if (!gateway) {
            return next(new ErrorResponse('Payment gateway not found', 404));
        }

        const testResult = await gateway.testConnection();

        res.status(200).json({
            success: true,
            message: 'Gateway test completed',
            data: {
                gateway,
                testResult
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get active payment gateways (public)
// @route   GET /api/payment-settings/public
// @access  Public
exports.getPublicPaymentSettings = async (req, res, next) => {
    try {
        const activeGateways = await PaymentSettings.find({ is_active: true })
            .select('gateway mode configuration')
            .sort({ createdAt: -1 });

        // Remove sensitive information for public access
        const publicGateways = activeGateways.map(gateway => ({
            gateway: gateway.gateway,
            mode: gateway.mode,
            configuration: {
                // Only include non-sensitive configuration data
                currency: gateway.configuration?.currency || 'USD',
                supportedMethods: gateway.configuration?.supportedMethods || []
            }
        }));

        res.status(200).json({
            success: true,
            data: publicGateways
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get gateway by type
// @route   GET /api/payment-settings/gateway/:gateway
// @access  Private (Admin only)
exports.getGatewayByType = async (req, res, next) => {
    try {
        const gateway = await PaymentSettings.getByGateway(req.params.gateway);

        if (!gateway) {
            return next(new ErrorResponse(`${req.params.gateway} gateway not found`, 404));
        }

        res.status(200).json({
            success: true,
            data: gateway
        });
    } catch (error) {
        next(error);
    }
};