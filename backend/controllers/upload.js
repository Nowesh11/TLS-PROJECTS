const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs");

// @desc    Upload file
// @route   POST /api/upload
// @access  Private (Admin only)
exports.uploadFile = asyncHandler(async (req, res, next) => {
    console.log("Upload request received");
    console.log("Files:", req.files);
    console.log("Body:", req.body);
    
    if (!req.files) {
        console.log("No files in request");
        return next(new ErrorResponse("Please upload a file", 400));
    }

    const file = req.files.file;
    const type = req.body.type || "general";

    // Make sure the file is an image for cover uploads
    if ((type === "book-cover" || type === "ebook-cover") && !file.mimetype.startsWith("image")) {
        return next(new ErrorResponse("Please upload an image file", 400));
    }

    // Check filesize - different limits for different file types
    let maxSize = 2 * 1024 * 1024; // 2MB default
    if (type === "ebook") {
        maxSize = 50 * 1024 * 1024; // 50MB for ebook files
    }
    
    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return next(new ErrorResponse(`Please upload a file less than ${maxSizeMB}MB`, 400));
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create type-specific directory with proper subdirectories
    let typeDir = "general";
    let subDir = "";
    
    if (type === "book-cover") {
        typeDir = "books";
    } else if (type === "ebook-cover") {
        typeDir = "ebooks";
        subDir = "image";
    } else if (type === "ebook") {
        typeDir = "ebooks";
        subDir = "file";
    }

    // Create the full directory path
    let fullUploadDir = path.join(uploadDir, typeDir);
    if (subDir) {
        fullUploadDir = path.join(fullUploadDir, subDir);
    }
    
    if (!fs.existsSync(fullUploadDir)) {
        fs.mkdirSync(fullUploadDir, { recursive: true });
    }

    // Create custom filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `${type}_${timestamp}${fileExtension}`;

    const filePath = path.join(fullUploadDir, fileName);

    // Move the file
    file.mv(filePath, async (err) => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse("Problem with file upload", 500));
        }

        // Return the file URL with proper subdirectory
        const fileUrl = subDir ? `/uploads/${typeDir}/${subDir}/${fileName}` : `/uploads/${typeDir}/${fileName}`;
        
        res.status(200).json({
            success: true,
            data: fileName,
            fileUrl: fileUrl,
            url: fileUrl // For backward compatibility
        });
    });
});