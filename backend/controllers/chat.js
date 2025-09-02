const Chat = require("../models/Chat");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all chats for admin or user's chats
// @route   GET /api/chat
// @access  Private
exports.getChats = async (req, res, next) => {
    try {
        let query = {};
        
        if (req.user.role === "admin") {
            // Admin can see all chats
            query = {};
        } else {
            // Users can only see their own chats
            query = { "participants.user": req.user.id };
        }

        const chats = await Chat.find(query)
            .populate("participants.user", "name email")
            .populate("assignedTo", "name email")
            .populate("messages.sender", "name email")
            .sort({ lastActivity: -1 });

        // Add unread count for each chat
        const chatsWithUnread = chats.map(chat => {
            const chatObj = chat.toObject();
            chatObj.unreadCount = chat.getUnreadCount(req.user.id);
            return chatObj;
        });

        res.status(200).json({
            success: true,
            count: chatsWithUnread.length,
            data: chatsWithUnread
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a specific chat
// @route   GET /api/chat/:id
// @access  Private
exports.getChat = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        
        // Users can only access their own chats
        if (req.user.role !== "admin") {
            query["participants.user"] = req.user.id;
        }

        const chat = await Chat.findOne(query)
            .populate("participants.user", "name email")
            .populate("assignedTo", "name email")
            .populate("messages.sender", "name email")
            .populate("messages.readBy.user", "name email");

        if (!chat) {
            return next(new ErrorResponse("Chat not found", 404));
        }

        // Mark messages as read for the current user
        await chat.markAsRead(req.user.id);

        res.status(200).json({
            success: true,
            data: chat
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new chat
// @route   POST /api/chat
// @access  Private
exports.createChat = async (req, res, next) => {
    try {
        const { subject, message, priority = "medium" } = req.body;

        if (!message) {
            return next(new ErrorResponse("Message content is required", 400));
        }

        // Check if user already has an active chat
        let existingChat = await Chat.findOne({
            "participants.user": req.user.id,
            status: "active"
        });

        if (existingChat) {
            // Add message to existing chat
            await existingChat.addMessage(req.user.id, req.user.role, message);
            
            const updatedChat = await Chat.findById(existingChat._id)
                .populate("participants.user", "name email")
                .populate("messages.sender", "name email");

            return res.status(200).json({
                success: true,
                data: updatedChat
            });
        }

        // Create new chat
        const chat = await Chat.create({
            participants: [
                { user: req.user.id, role: req.user.role }
            ],
            messages: [{
                sender: req.user.id,
                senderRole: req.user.role,
                content: message
            }],
            subject: subject || "Support Request",
            priority: priority,
            metadata: {
                userAgent: req.headers["user-agent"],
                ipAddress: req.ip,
                source: "direct_chat"
            }
        });

        const populatedChat = await Chat.findById(chat._id)
            .populate("participants.user", "name email")
            .populate("messages.sender", "name email");

        // Emit real-time message to all participants for new public chat
        const io = req.app.get('io');
        if (io) {
            const latestMessage = populatedChat.messages[populatedChat.messages.length - 1];
            io.to(chat._id.toString()).emit('new_chat', {
                chatId: chat._id,
                chat: populatedChat,
                message: latestMessage
            });
        }

        res.status(201).json({
            success: true,
            data: populatedChat
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message in a chat
// @route   POST /api/chat/:id/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const { content, messageType = "text" } = req.body;

        if (!content) {
            return next(new ErrorResponse("Message content is required", 400));
        }

        let query = { _id: req.params.id };
        let senderId, senderRole, sender;
        
        // Check if this is a public message (no authentication)
        if (req.user) {
            // Authenticated user
            if (req.user.role !== "admin") {
                query["participants.user"] = req.user.id;
            }
            senderId = req.user.id;
            senderRole = req.user.role;
            sender = req.user;
        } else {
            // Public/guest message - find the user from chat participants
            const chat = await Chat.findById(req.params.id).populate("participants.user");
            if (!chat) {
                return next(new ErrorResponse("Chat not found", 404));
            }
            
            // Use the first non-admin participant as sender
            const userParticipant = chat.participants.find(p => p.role === "user");
            if (!userParticipant) {
                return next(new ErrorResponse("No user participant found in chat", 400));
            }
            
            senderId = userParticipant.user._id;
            senderRole = "user";
            sender = userParticipant.user;
        }

        const chat = await Chat.findOne(query);

        if (!chat) {
            return next(new ErrorResponse("Chat not found", 404));
        }

        // Add admin to participants if not already present (for admin replies)
        if (req.user && req.user.role === "admin") {
            const adminParticipant = chat.participants.find(p => p.role === "admin");
            if (!adminParticipant) {
                chat.participants.push({ user: req.user.id, role: "admin" });
            }
        }

        await chat.addMessage(senderId, senderRole, content, messageType);

        const updatedChat = await Chat.findById(chat._id)
            .populate("participants.user", "name email")
            .populate("messages.sender", "name email");

        // Emit real-time message to all participants
        const io = req.app.get('io');
        if (io) {
            const latestMessage = updatedChat.messages[updatedChat.messages.length - 1];
            io.to(chat._id.toString()).emit('receive_message', {
                chatId: chat._id,
                message: latestMessage,
                sender: sender
            });
        }

        res.status(200).json({
            success: true,
            data: updatedChat
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send message with file attachment
// @route   POST /api/chat/:id/message/file
// @access  Private
exports.sendMessageWithFile = async (req, res, next) => {
    try {
        const { content = '' } = req.body;
        const file = req.file;

        if (!file) {
            return next(new ErrorResponse("No file uploaded", 400));
        }

        let query = { _id: req.params.id };
        
        // Users can only send messages to their own chats
        if (req.user.role !== "admin") {
            query["participants.user"] = req.user.id;
        }

        const chat = await Chat.findOne(query);

        if (!chat) {
            return next(new ErrorResponse("Chat not found", 404));
        }

        // Add admin to participants if not already present (for admin replies)
        if (req.user.role === "admin") {
            const adminParticipant = chat.participants.find(p => p.role === "admin");
            if (!adminParticipant) {
                chat.participants.push({ user: req.user.id, role: "admin" });
            }
        }

        // Create attachment object
        const attachment = {
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
        };

        // Determine message type based on file type
        let messageType = 'file';
        if (file.mimetype.startsWith('image/')) {
            messageType = 'image';
        }

        await chat.addMessage(req.user.id, req.user.role, content || `Sent a file: ${file.originalname}`, messageType, [attachment]);

        const updatedChat = await Chat.findById(chat._id)
            .populate("participants.user", "name email")
            .populate("messages.sender", "name email");

        // Emit real-time message to all participants
        const io = req.app.get('io');
        if (io) {
            const latestMessage = updatedChat.messages[updatedChat.messages.length - 1];
            io.to(chat._id.toString()).emit('receive_message', {
                chatId: chat._id,
                message: latestMessage,
                sender: req.user
            });
        }

        res.status(200).json({
            success: true,
            data: updatedChat
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update chat status
// @route   PUT /api/chat/:id/status
// @access  Private (Admin only)
exports.updateChatStatus = async (req, res, next) => {
    try {
        const { status, assignedTo } = req.body;

        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return next(new ErrorResponse("Chat not found", 404));
        }

        if (status) {
            chat.status = status;
        }

        if (assignedTo) {
            chat.assignedTo = assignedTo;
        }

        await chat.save();

        const updatedChat = await Chat.findById(chat._id)
            .populate("participants.user", "name email")
            .populate("assignedTo", "name email");

        res.status(200).json({
            success: true,
            data: updatedChat
        });
    } catch (error) {
        next(error);
    }
};



// @desc    Create a public chat (no authentication required)
// @route   POST /api/chat/public
// @access  Public
exports.createPublicChat = async (req, res, next) => {
    try {
        const { name, email, subject, message, priority = "medium" } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: "Name, email, and message are required"
            });
        }

        // Find or create user for the contact
        let user = await User.findOne({ email: email });
        
        if (!user) {
            // Hash the default password
            const bcrypt = require("bcryptjs");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("defaultPassword123!", salt);
            
            // Create a permanent user account
            user = await User.create({
                name: name,
                email: email,
                role: "user",
                password: hashedPassword,
                emailVerified: false
            });
        }

        // Create new chat
        const chat = await Chat.create({
            participants: [
                { user: user._id, role: "user" }
            ],
            messages: [{
                sender: user._id,
                senderRole: "user",
                content: message
            }],
            subject: subject || "Support Request",
            priority: priority,
            metadata: {
                userAgent: req.headers["user-agent"],
                ipAddress: req.ip,
                source: "public_chat"
            }
        });

        const populatedChat = await Chat.findById(chat._id)
            .populate("participants.user", "name email")
            .populate("messages.sender", "name email");

        res.status(201).json({
            success: true,
            data: populatedChat
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get chat statistics for admin
// @route   GET /api/chat/stats
// @access  Private (Admin only)
exports.getChatStats = async (req, res, next) => {
    try {
        const totalChats = await Chat.countDocuments();
        const activeChats = await Chat.countDocuments({ status: "active" });
        const closedChats = await Chat.countDocuments({ status: "closed" });
        
        const unassignedChats = await Chat.countDocuments({ 
            status: "active", 
            assignedTo: { $exists: false } 
        });

        const highPriorityChats = await Chat.countDocuments({ 
            status: "active", 
            priority: { $in: ["high", "urgent"] } 
        });

        // Get recent activity
        const recentChats = await Chat.find({ status: "active" })
            .populate("participants.user", "name email")
            .sort({ lastActivity: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                totalChats,
                activeChats,
                closedChats,
                unassignedChats,
                highPriorityChats,
                recentChats
            }
        });
    } catch (error) {
        next(error);
    }
};