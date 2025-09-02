const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs").promises;
const archiver = require("archiver");
const Book = require("../models/Book");
const Ebook = require("../models/Ebook");
const Project = require("../models/Project");
const Activity = require("../models/Activity");
const MediaUpload = require("../models/MediaUpload");

// @desc    Get file storage statistics
// @route   GET /api/files/stats
// @access  Private (Admin only)
exports.getFileStats = asyncHandler(async (req, res, next) => {
    try {
        const uploadsDir = path.join(__dirname, "../public/uploads");
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            categories: {}
        };

        // Get all subdirectories
        const categories = await fs.readdir(uploadsDir);
        
        for (const category of categories) {
            const categoryPath = path.join(uploadsDir, category);
            const categoryStats = await fs.stat(categoryPath);
            
            if (categoryStats.isDirectory()) {
                const files = await fs.readdir(categoryPath);
                let categorySize = 0;
                let fileCount = 0;
                
                for (const file of files) {
                    const filePath = path.join(categoryPath, file);
                    const fileStats = await fs.stat(filePath);
                    
                    if (fileStats.isFile()) {
                        categorySize += fileStats.size;
                        fileCount++;
                    }
                }
                
                stats.categories[category] = {
                    fileCount,
                    size: categorySize,
                    sizeFormatted: formatFileSize(categorySize)
                };
                
                stats.totalFiles += fileCount;
                stats.totalSize += categorySize;
            }
        }
        
        stats.totalSizeFormatted = formatFileSize(stats.totalSize);
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(new ErrorResponse("Error getting file statistics", 500));
    }
});

// @desc    Get all files with metadata
// @route   GET /api/files
// @access  Private (Admin only)
exports.getAllFiles = asyncHandler(async (req, res, next) => {
    try {
        const { category, page = 1, limit = 50 } = req.query;
        const uploadsDir = path.join(__dirname, "../public/uploads");
        const allFiles = [];
        
        // Get categories to scan
        const categoriesToScan = category ? [category] : await fs.readdir(uploadsDir);
        
        for (const cat of categoriesToScan) {
            const categoryPath = path.join(uploadsDir, cat);
            
            try {
                const categoryStats = await fs.stat(categoryPath);
                if (!categoryStats.isDirectory()) continue;
                
                const files = await fs.readdir(categoryPath);
                
                for (const file of files) {
                    const filePath = path.join(categoryPath, file);
                    const fileStats = await fs.stat(filePath);
                    
                    if (fileStats.isFile()) {
                        // Try to find associated database record
                        const dbRecord = await findAssociatedRecord(file, cat);
                        
                        allFiles.push({
                            filename: file,
                            category: cat,
                            path: `/uploads/${cat}/${file}`,
                            size: fileStats.size,
                            sizeFormatted: formatFileSize(fileStats.size),
                            createdAt: fileStats.birthtime,
                            modifiedAt: fileStats.mtime,
                            extension: path.extname(file),
                            associatedRecord: dbRecord
                        });
                    }
                }
            } catch (err) {
                console.log(`Error scanning category ${cat}:`, err.message);
            }
        }
        
        // Sort by creation date (newest first)
        allFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFiles = allFiles.slice(startIndex, endIndex);
        
        res.status(200).json({
            success: true,
            count: paginatedFiles.length,
            total: allFiles.length,
            page: parseInt(page),
            pages: Math.ceil(allFiles.length / limit),
            data: paginatedFiles
        });
    } catch (error) {
        next(new ErrorResponse("Error getting files", 500));
    }
});

// @desc    Export files as ZIP
// @route   GET /api/files/export
// @access  Private (Admin only)
exports.exportFiles = asyncHandler(async (req, res, next) => {
    try {
        const { category, format = "zip" } = req.query;
        const uploadsDir = path.join(__dirname, "../public/uploads");
        
        // Set response headers for file download
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = category ? `${category}_files_${timestamp}.zip` : `all_files_${timestamp}.zip`;
        
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        
        // Create ZIP archive
        const archive = archiver("zip", {
            zlib: { level: 9 } // Maximum compression
        });
        
        archive.pipe(res);
        
        // Add files to archive
        const categoriesToExport = category ? [category] : await fs.readdir(uploadsDir);
        
        for (const cat of categoriesToExport) {
            const categoryPath = path.join(uploadsDir, cat);
            
            try {
                const categoryStats = await fs.stat(categoryPath);
                if (categoryStats.isDirectory()) {
                    archive.directory(categoryPath, cat);
                }
            } catch (err) {
                console.log(`Error adding category ${cat} to archive:`, err.message);
            }
        }
        
        // Generate file manifest
        const manifest = await generateFileManifest(categoriesToExport);
        archive.append(JSON.stringify(manifest, null, 2), { name: "file_manifest.json" });
        
        archive.finalize();
        
    } catch (error) {
        next(new ErrorResponse("Error exporting files", 500));
    }
});

// @desc    Clean up orphaned files
// @route   DELETE /api/files/cleanup
// @access  Private (Admin only)
exports.cleanupOrphanedFiles = asyncHandler(async (req, res, next) => {
    try {
        const uploadsDir = path.join(__dirname, "../public/uploads");
        const orphanedFiles = [];
        const categories = await fs.readdir(uploadsDir);
        
        for (const category of categories) {
            const categoryPath = path.join(uploadsDir, category);
            const categoryStats = await fs.stat(categoryPath);
            
            if (categoryStats.isDirectory()) {
                const files = await fs.readdir(categoryPath);
                
                for (const file of files) {
                    const dbRecord = await findAssociatedRecord(file, category);
                    
                    if (!dbRecord) {
                        orphanedFiles.push({
                            filename: file,
                            category,
                            path: path.join(categoryPath, file)
                        });
                    }
                }
            }
        }
        
        // Delete orphaned files if requested
        if (req.query.delete === "true") {
            let deletedCount = 0;
            
            for (const orphan of orphanedFiles) {
                try {
                    await fs.unlink(orphan.path);
                    deletedCount++;
                } catch (err) {
                    console.log(`Error deleting ${orphan.filename}:`, err.message);
                }
            }
            
            res.status(200).json({
                success: true,
                message: `Cleaned up ${deletedCount} orphaned files`,
                deletedCount,
                orphanedFiles: orphanedFiles.map(f => ({ filename: f.filename, category: f.category }))
            });
        } else {
            res.status(200).json({
                success: true,
                message: `Found ${orphanedFiles.length} orphaned files`,
                count: orphanedFiles.length,
                orphanedFiles: orphanedFiles.map(f => ({ filename: f.filename, category: f.category }))
            });
        }
        
    } catch (error) {
        next(new ErrorResponse("Error cleaning up files", 500));
    }
});

// Helper function to find associated database record
async function findAssociatedRecord(filename, category) {
    try {
        const fileUrl = `/uploads/${category}/${filename}`;
        
        switch (category) {
            case "books":
                return await Book.findOne({ coverImage: fileUrl }).select("title titleTamil _id");
            case "ebooks":
                const ebook = await Ebook.findOne({ coverImage: fileUrl }).select("title titleTamil _id");
                if (!ebook) {
                    // Also check for PDF files
                    return await Ebook.findOne({ fileUrl: fileUrl }).select("title titleTamil _id");
                }
                return ebook;
            case "projects":
                return await Project.findOne({ image: fileUrl }).select("title titleTamil _id");
            case "activities":
                return await Activity.findOne({ image: fileUrl }).select("title titleTamil _id");
            case "general":
                return await MediaUpload.findOne({ file_url: fileUrl }).select("title original_filename _id");
            default:
                return null;
        }
    } catch (error) {
        console.log(`Error finding associated record for ${filename}:`, error.message);
        return null;
    }
}

// Helper function to generate file manifest
async function generateFileManifest(categories) {
    const manifest = {
        exportDate: new Date().toISOString(),
        categories: {},
        summary: {
            totalFiles: 0,
            totalSize: 0
        }
    };
    
    const uploadsDir = path.join(__dirname, "../public/uploads");
    
    for (const category of categories) {
        const categoryPath = path.join(uploadsDir, category);
        
        try {
            const files = await fs.readdir(categoryPath);
            const categoryData = {
                fileCount: 0,
                totalSize: 0,
                files: []
            };
            
            for (const file of files) {
                const filePath = path.join(categoryPath, file);
                const fileStats = await fs.stat(filePath);
                
                if (fileStats.isFile()) {
                    const dbRecord = await findAssociatedRecord(file, category);
                    
                    categoryData.files.push({
                        filename: file,
                        size: fileStats.size,
                        createdAt: fileStats.birthtime,
                        associatedRecord: dbRecord ? {
                            id: dbRecord._id,
                            title: dbRecord.title || dbRecord.original_filename
                        } : null
                    });
                    
                    categoryData.fileCount++;
                    categoryData.totalSize += fileStats.size;
                }
            }
            
            manifest.categories[category] = categoryData;
            manifest.summary.totalFiles += categoryData.fileCount;
            manifest.summary.totalSize += categoryData.totalSize;
            
        } catch (err) {
            console.log(`Error processing category ${category} for manifest:`, err.message);
        }
    }
    
    return manifest;
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}