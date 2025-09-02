const Cart = require("../models/Cart");
const Book = require("../models/Book");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Public (with session support)
exports.getCart = async (req, res, next) => {
    try {
        let cart;
        
        if (req.user) {
            // Authenticated user
            cart = await Cart.findOne({ user: req.user.id }).populate("items.book");
        } else {
            // Guest user with session
            const sessionId = req.headers["x-session-id"] || req.query.sessionId;
            if (!sessionId) {
                return res.status(200).json({
                    success: true,
                    data: {
                        items: [],
                        totalAmount: 0,
                        totalItems: 0
                    }
                });
            }
            cart = await Cart.findOne({ sessionId }).populate("items.book");
        }

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Public (with session support)
exports.addToCart = async (req, res, next) => {
    try {
        const { bookId, quantity = 1 } = req.body;

        // Validate book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return next(new ErrorResponse("Book not found", 404));
        }

        if (book.status !== "active") {
            return next(new ErrorResponse("Book is not available for purchase", 400));
        }

        let cart;
        const cartQuery = req.user 
            ? { user: req.user.id }
            : { sessionId: req.headers["x-session-id"] || req.body.sessionId };

        if (!req.user && !cartQuery.sessionId) {
            return next(new ErrorResponse("Session ID required for guest users", 400));
        }

        cart = await Cart.findOne(cartQuery);

        if (!cart) {
            // Create new cart
            cart = new Cart({
                ...cartQuery,
                items: [{
                    book: bookId,
                    quantity: parseInt(quantity),
                    price: book.price
                }]
            });
        } else {
            // Check if item already exists in cart
            const existingItemIndex = cart.items.findIndex(
                item => item.book.toString() === bookId
            );

            if (existingItemIndex > -1) {
                // Increment existing quantity
                cart.items[existingItemIndex].quantity += parseInt(quantity);
            } else {
                // Add new item
                cart.items.push({
                    book: bookId,
                    quantity: parseInt(quantity),
                    price: book.price
                });
            }
        }

        await cart.save();
        await cart.populate("items.book");

        res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Public (with session support)
exports.updateCartItem = async (req, res, next) => {
    try {
        const { bookId, quantity } = req.body;

        if (quantity < 0) {
            return next(new ErrorResponse("Quantity cannot be negative", 400));
        }

        const cartQuery = req.user 
            ? { user: req.user.id }
            : { sessionId: req.headers["x-session-id"] || req.body.sessionId };

        const cart = await Cart.findOne(cartQuery);
        if (!cart) {
            return next(new ErrorResponse("Cart not found", 404));
        }

        if (quantity === 0) {
            // Remove item from cart
            cart.items = cart.items.filter(item => item.book.toString() !== bookId);
        } else {
            // Update quantity
            const itemIndex = cart.items.findIndex(item => item.book.toString() === bookId);
            if (itemIndex === -1) {
                return next(new ErrorResponse("Item not found in cart", 404));
            }
            cart.items[itemIndex].quantity = parseInt(quantity);
        }

        await cart.save();
        await cart.populate("items.book");

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:bookId
// @access  Public (with session support)
exports.removeFromCart = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        const cartQuery = req.user 
            ? { user: req.user.id }
            : { sessionId: req.headers["x-session-id"] || req.query.sessionId };

        const cart = await Cart.findOne(cartQuery);
        if (!cart) {
            return next(new ErrorResponse("Cart not found", 404));
        }

        cart.items = cart.items.filter(item => item.book.toString() !== bookId);
        await cart.save();
        await cart.populate("items.book");

        res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Public
exports.clearCart = async (req, res, next) => {
    try {
        const identifier = req.user ? { user: req.user.id } : { sessionId: req.sessionID };
        
        const cart = await Cart.findOne(identifier);
        
        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Cart is already empty",
                data: { items: [], totalAmount: 0, totalItems: 0 }
            });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Checkout cart
// @route   POST /api/cart/checkout
// @access  Public
exports.checkoutCart = async (req, res, next) => {
    try {
        const { name, email, paymentMethod } = req.body;
        
        // Validate required fields
        if (!name || !email || !paymentMethod) {
            return next(new ErrorResponse("Name, email, and payment method are required", 400));
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return next(new ErrorResponse("Please provide a valid email", 400));
        }

        // Validate payment method
        if (!["E-PAY UM", "FBX"].includes(paymentMethod)) {
            return next(new ErrorResponse("Invalid payment method", 400));
        }

        // Get cart
        const identifier = req.user ? { user: req.user.id } : { sessionId: req.sessionID };
        const cart = await Cart.findOne(identifier).populate("items.book");
        
        if (!cart || cart.items.length === 0) {
            return next(new ErrorResponse("Cart is empty", 400));
        }

        // Validate all books are still available
        for (const item of cart.items) {
            if (!item.book || item.book.status !== "active") {
                return next(new ErrorResponse(`Book "${item.book?.title || "Unknown"}" is no longer available`, 400));
            }
        }

        const Purchase = require("../models/Purchase");
        const purchaseBooks = [];

        // Prepare books data for purchase
        for (const item of cart.items) {
            purchaseBooks.push({
                book: item.book._id,
                title: item.book.title,
                titleTamil: item.book.titleTamil,
                price: item.price,
                quantity: item.quantity
            });
        }

        // Calculate total amount
        const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Handle payment proof file if provided
        let paymentProofPath = null;
        if (req.file) {
            // Validate file type (PDF only)
            if (req.file.mimetype !== "application/pdf") {
                return next(new ErrorResponse("Only PDF files are allowed for payment proof", 400));
            }

            // Save payment proof file
            const uploadPath = "./public/uploads/payment-proofs/";
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const filePath = uploadPath + fileName;

            // Ensure upload directory exists
            const fs = require("fs");
            const path = require("path");
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            // Move the file to the upload directory
            fs.writeFileSync(filePath, req.file.buffer);
            paymentProofPath = `/uploads/payment-proofs/${fileName}`;
        }

        // Create single purchase record for all cart items
        const purchaseData = {
            customerName: name.trim(),
            customerEmail: email.toLowerCase().trim(),
            books: purchaseBooks,
            totalAmount,
            paymentMethod,
            paymentStatus: "pending",
            orderStatus: "pending"
        };

        // Add payment proof if provided
        if (paymentProofPath) {
            purchaseData.paymentProof = paymentProofPath;
        }

        // Add shipping information if provided
        if (req.body.shippingAddress) {
            try {
                purchaseData.shippingAddress = typeof req.body.shippingAddress === "string" 
                    ? JSON.parse(req.body.shippingAddress) 
                    : req.body.shippingAddress;
            } catch (error) {
                return next(new ErrorResponse("Invalid shipping address format", 400));
            }
        }

        // Add user reference if authenticated
        if (req.user) {
            purchaseData.user = req.user.id;
        }

        const purchase = await Purchase.create(purchaseData);

        // Clear cart after successful checkout
        cart.items = [];
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Checkout completed successfully. Please complete payment and upload proof.",
            data: {
                orderNumber: purchase.orderNumber,
                orderId: purchase._id,
                books: purchase.books.map(book => ({
                    title: book.title,
                    titleTamil: book.titleTamil,
                    quantity: book.quantity,
                    price: book.price
                })),
                totalAmount: purchase.totalAmount,
                paymentMethod: purchase.paymentMethod,
                paymentProofUploaded: !!purchase.paymentProof,
                nextStep: paymentMethod === "E-PAY UM" ? "payment_link" : "bank_transfer"
            }
        });
    } catch (error) {
        next(error);
    }
};