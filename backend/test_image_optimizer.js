const imageOptimizer = require("./middleware/imageOptimizer");
const fs = require("fs");
const path = require("path");

// Test the ImageOptimizer
const testImageOptimizer = async () => {
    try {
        console.log("Testing ImageOptimizer...");
        
        // Create a simple test image buffer (1x1 pixel PNG)
        const pngData = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
        
        // Create a mock file object
        const mockFile = {
            buffer: pngData,
            originalname: "test.png",
            mimetype: "image/png",
            size: pngData.length
        };
        
        console.log("Mock file created:", {
            originalname: mockFile.originalname,
            mimetype: mockFile.mimetype,
            size: mockFile.size
        });
        
        // Test validation
        const validation = imageOptimizer.validateImage(mockFile);
        console.log("Validation result:", validation);
        
        if (!validation.isValid) {
            console.log("Validation failed:", validation.errors);
            return;
        }
        
        // Test processBookCover
        console.log("Testing processBookCover...");
        const bookId = "test-book-id";
        
        try {
            const result = await imageOptimizer.processBookCover(mockFile, bookId);
            console.log("processBookCover result:", result);
            
            // Check if the file was created
            const fullPath = path.join(__dirname, "public", result.path.substring(1)); // Remove leading slash
            const fileExists = fs.existsSync(fullPath);
            console.log("File created at:", fullPath);
            console.log("File exists:", fileExists);
            
        } catch (processError) {
            console.error("processBookCover failed:", processError.message);
            console.error("Stack:", processError.stack);
        }
        
    } catch (error) {
        console.error("Test failed:", error.message);
        console.error("Stack:", error.stack);
    }
};

testImageOptimizer();