const Purchase = require('../models/Purchase');
const Book = require('../models/Book');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all purchases with filtering, search, and pagination
exports.getPurchases = async (req, res) => {
    try {
        const { q = '', status = '', page = 1, limit = 10, sort = '-purchased_at' } = req.query;
        
        // Build query
        let query = {};
        
        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Search query
        let searchQuery = {};
        if (q) {
            // We'll populate and then filter, or use aggregation
            searchQuery = {
                $or: [
                    { transaction_id: { $regex: q, $options: 'i' } },
                    { notes: { $regex: q, $options: 'i' } }
                ]
            };
            query = { ...query, ...searchQuery };
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get purchases with populated data
        const purchases = await Purchase.find(query)
            .populate('user_id', 'name email')
            .populate('book_id', 'title author price cover_image_path')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const total = await Purchase.countDocuments(query);
        
        // If search query includes user or book info, we need to filter after population
        let filteredPurchases = purchases;
        if (q) {
            const searchLower = q.toLowerCase();
            filteredPurchases = purchases.filter(purchase => {
                const userName = purchase.user_id?.name?.toLowerCase() || '';
                const userEmail = purchase.user_id?.email?.toLowerCase() || '';
                const bookTitle = purchase.book_id?.title?.toLowerCase() || '';
                const bookAuthor = purchase.book_id?.author?.toLowerCase() || '';
                const transactionId = purchase.transaction_id?.toLowerCase() || '';
                
                return userName.includes(searchLower) ||
                       userEmail.includes(searchLower) ||
                       bookTitle.includes(searchLower) ||
                       bookAuthor.includes(searchLower) ||
                       transactionId.includes(searchLower);
            });
        }
        
        res.json({
            success: true,
            data: filteredPurchases,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: total,
                total_pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching purchases',
            error: error.message
        });
    }
};

// Get single purchase by ID
exports.getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const purchase = await Purchase.findById(id)
            .populate('user_id', 'name email phone')
            .populate('book_id', 'title author price cover_image_path file_path description');
        
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }
        
        res.json({
            success: true,
            data: purchase
        });
    } catch (error) {
        console.error('Error fetching purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching purchase',
            error: error.message
        });
    }
};

// Update purchase (for refunds, delivery status, etc.)
exports.updatePurchase = async (req, res) => {
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
        const { status, notes, refund_reason } = req.body;
        
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }
        
        // Handle different status updates
        if (status === 'refunded' && purchase.status !== 'refunded') {
            await purchase.refund(refund_reason || 'Admin refund');
        } else if (status === 'paid' && !purchase.delivered_at) {
            await purchase.markAsDelivered();
        } else {
            // General status update
            purchase.status = status;
            if (notes) purchase.notes = notes;
            await purchase.save();
        }
        
        // Populate and return updated purchase
        const updatedPurchase = await Purchase.findById(id)
            .populate('user_id', 'name email')
            .populate('book_id', 'title author price cover_image_path');
        
        res.json({
            success: true,
            message: 'Purchase updated successfully',
            data: updatedPurchase
        });
    } catch (error) {
        console.error('Error updating purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating purchase',
            error: error.message
        });
    }
};

// Mark purchase as delivered
exports.markAsDelivered = async (req, res) => {
    try {
        const { id } = req.params;
        
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }
        
        if (purchase.delivered_at) {
            return res.status(400).json({
                success: false,
                message: 'Purchase already marked as delivered'
            });
        }
        
        await purchase.markAsDelivered();
        
        const updatedPurchase = await Purchase.findById(id)
            .populate('user_id', 'name email')
            .populate('book_id', 'title author price');
        
        res.json({
            success: true,
            message: 'Purchase marked as delivered',
            data: updatedPurchase
        });
    } catch (error) {
        console.error('Error marking purchase as delivered:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking purchase as delivered',
            error: error.message
        });
    }
};

// Refund purchase
exports.refundPurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Admin refund' } = req.body;
        
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }
        
        if (purchase.status === 'refunded') {
            return res.status(400).json({
                success: false,
                message: 'Purchase already refunded'
            });
        }
        
        await purchase.refund(reason);
        
        const updatedPurchase = await Purchase.findById(id)
            .populate('user_id', 'name email')
            .populate('book_id', 'title author price');
        
        res.json({
            success: true,
            message: 'Purchase refunded successfully',
            data: updatedPurchase
        });
    } catch (error) {
        console.error('Error refunding purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Error refunding purchase',
            error: error.message
        });
    }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }
        
        await Purchase.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Purchase deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting purchase',
            error: error.message
        });
    }
};

// Get purchase statistics
exports.getPurchaseStats = async (req, res) => {
    try {
        const stats = await Purchase.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total_amount: { $sum: '$amount' }
                }
            }
        ]);
        
        const totalPurchases = await Purchase.countDocuments();
        const totalRevenue = await Purchase.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        res.json({
            success: true,
            data: {
                by_status: stats,
                total_purchases: totalPurchases,
                total_revenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Error fetching purchase stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching purchase statistics',
            error: error.message
        });
    }
};