const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

class ImageOptimizer {
    constructor() {
        this.supportedFormats = ["jpeg", "jpg", "png", "webp", "gif"];
        this.maxWidth = 1200;
        this.maxHeight = 1600;
        this.defaultQuality = 85;
    }

    // Validate image file
    validateImage(file) {
        const errors = [];

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            errors.push("File size must be less than 5MB");
        }

        // Check file type
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        if (!this.supportedFormats.includes(ext)) {
            errors.push(`Unsupported format. Supported formats: ${this.supportedFormats.join(", ")}`);
        }

        // Check MIME type
        if (!file.mimetype.startsWith("image/")) {
            errors.push("File must be an image");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Optimize single image
    async optimizeImage(inputBuffer, options = {}) {
        const {
            width = null,
            height = null,
            quality = this.defaultQuality,
            format = "webp",
            maintainAspectRatio = true
        } = options;

        try {
            let pipeline = sharp(inputBuffer);

            // Get image metadata
            const metadata = await pipeline.metadata();

            // Resize if needed
            if (width || height) {
                const resizeOptions = {
                    fit: maintainAspectRatio ? "inside" : "cover",
                    withoutEnlargement: true
                };

                if (width) resizeOptions.width = Math.min(width, this.maxWidth);
                if (height) resizeOptions.height = Math.min(height, this.maxHeight);

                pipeline = pipeline.resize(resizeOptions);
            } else {
                // Apply max dimensions if no specific size requested
                if (metadata.width > this.maxWidth || metadata.height > this.maxHeight) {
                    pipeline = pipeline.resize({
                        width: this.maxWidth,
                        height: this.maxHeight,
                        fit: "inside",
                        withoutEnlargement: true
                    });
                }
            }

            // Apply format and quality
            switch (format.toLowerCase()) {
                case "jpeg":
                case "jpg":
                    pipeline = pipeline.jpeg({ quality, progressive: true });
                    break;
                case "png":
                    pipeline = pipeline.png({ 
                        quality, 
                        compressionLevel: 9,
                        progressive: true 
                    });
                    break;
                case "webp":
                    pipeline = pipeline.webp({ quality, effort: 6 });
                    break;
                default:
                    pipeline = pipeline.webp({ quality, effort: 6 });
            }

            const optimizedBuffer = await pipeline.toBuffer();

            return {
                buffer: optimizedBuffer,
                metadata: await sharp(optimizedBuffer).metadata(),
                originalSize: inputBuffer.length,
                optimizedSize: optimizedBuffer.length,
                compressionRatio: ((inputBuffer.length - optimizedBuffer.length) / inputBuffer.length * 100).toFixed(2)
            };

        } catch (error) {
            throw new Error(`Image optimization failed: ${error.message}`);
        }
    }

    // Generate multiple sizes for responsive images
    async generateResponsiveSizes(inputBuffer, baseName) {
        const sizes = [
            { suffix: "_thumb", width: 150, height: 200 },
            { suffix: "_small", width: 300, height: 400 },
            { suffix: "_medium", width: 600, height: 800 },
            { suffix: "_large", width: 900, height: 1200 }
        ];

        const results = {};

        for (const size of sizes) {
            try {
                const optimized = await this.optimizeImage(inputBuffer, {
                    width: size.width,
                    height: size.height,
                    format: "webp"
                });

                results[size.suffix] = {
                    buffer: optimized.buffer,
                    filename: `${baseName}${size.suffix}.webp`,
                    width: size.width,
                    height: size.height,
                    size: optimized.optimizedSize
                };
            } catch (error) {
                console.error(`Failed to generate ${size.suffix} size:`, error);
            }
        }

        return results;
    }

    // Save optimized image to disk
    async saveOptimizedImage(buffer, outputPath) {
        try {
            await fs.writeFile(outputPath, buffer);
            return outputPath;
        } catch (error) {
            throw new Error(`Failed to save image: ${error.message}`);
        }
    }

    // Process and save book cover image
    async processBookCover(file, bookId) {
        const validation = this.validateImage(file);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(", "));
        }

        const baseName = `cover_${bookId}_${Date.now()}`;
        const uploadsDir = path.join(__dirname, "../public/uploads/books");

        // Ensure directory exists
        await fs.mkdir(uploadsDir, { recursive: true });

        try {
            // Optimize main cover image
            const optimized = await this.optimizeImage(file.buffer, {
                width: 400,
                height: 600,
                format: "webp",
                quality: 90
            });

            const filename = `${baseName}.webp`;
            const filepath = path.join(uploadsDir, filename);
            
            await this.saveOptimizedImage(optimized.buffer, filepath);

            // Generate responsive sizes
            const responsiveSizes = await this.generateResponsiveSizes(file.buffer, baseName);
            
            // Save responsive sizes
            for (const [suffix, sizeData] of Object.entries(responsiveSizes)) {
                const sizePath = path.join(uploadsDir, sizeData.filename);
                await this.saveOptimizedImage(sizeData.buffer, sizePath);
            }

            return {
                filename,
                path: `/uploads/books/${filename}`,
                responsiveSizes: Object.keys(responsiveSizes).reduce((acc, suffix) => {
                    acc[suffix] = `/uploads/books/${responsiveSizes[suffix].filename}`;
                    return acc;
                }, {}),
                metadata: optimized.metadata,
                compressionRatio: optimized.compressionRatio
            };

        } catch (error) {
            throw new Error(`Failed to process book cover: ${error.message}`);
        }
    }

    // Process multiple book images
    async processBookImages(files, bookId) {
        const results = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                const validation = this.validateImage(file);
                if (!validation.isValid) {
                    errors.push(`File ${i + 1}: ${validation.errors.join(", ")}`);
                    continue;
                }

                const baseName = `image_${bookId}_${Date.now()}_${i}`;
                const uploadsDir = path.join(__dirname, "../public/uploads/books");

                // Optimize image
                const optimized = await this.optimizeImage(file.buffer, {
                    width: 800,
                    height: 1000,
                    format: "webp",
                    quality: 85
                });

                const filename = `${baseName}.webp`;
                const filepath = path.join(uploadsDir, filename);
                
                await this.saveOptimizedImage(optimized.buffer, filepath);

                results.push({
                    filename,
                    path: `/uploads/books/${filename}`,
                    metadata: optimized.metadata,
                    compressionRatio: optimized.compressionRatio
                });

            } catch (error) {
                errors.push(`File ${i + 1}: ${error.message}`);
            }
        }

        return {
            results,
            errors,
            processed: results.length,
            failed: errors.length
        };
    }

    // Clean up old images
    async cleanupOldImages(imagePaths) {
        const cleanupResults = [];

        for (const imagePath of imagePaths) {
            try {
                const fullPath = path.join(__dirname, "../public", imagePath);
                await fs.unlink(fullPath);
                cleanupResults.push({ path: imagePath, success: true });
            } catch (error) {
                cleanupResults.push({ 
                    path: imagePath, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        return cleanupResults;
    }

    // Get image info
    async getImageInfo(imagePath) {
        try {
            const fullPath = path.join(__dirname, "../public", imagePath);
            const buffer = await fs.readFile(fullPath);
            const metadata = await sharp(buffer).metadata();
            const stats = await fs.stat(fullPath);

            return {
                exists: true,
                metadata,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            return {
                exists: false,
                error: error.message
            };
        }
    }
}

module.exports = new ImageOptimizer();