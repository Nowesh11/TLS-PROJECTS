const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

// Create a simple test image (1x1 pixel PNG)
const createTestImage = () => {
    // Simple 1x1 pixel PNG in base64
    const pngData = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
    return pngData;
};

// Test upload function
const testUpload = async () => {
    try {
        const testImage = createTestImage();
        const bookId = "68935887f0fc172c7fed76d5";
        
        // Create form data
        const form = new FormData();
        form.append("coverImage", testImage, {
            filename: "test-cover.png",
            contentType: "image/png"
        });
        
        console.log("Testing upload to book ID:", bookId);
        console.log("Uploading to: http://localhost:8080/api/books/" + bookId + "/upload-cover");
        
        const response = await fetch(`http://localhost:8080/api/books/${bookId}/upload-cover`, {
            method: "POST",
            body: form,
            headers: {
                // Add any auth headers if needed
                "Authorization": "Bearer your-token-here" // You'll need to replace this
            }
        });
        
        const result = await response.text();
        console.log("Response status:", response.status);
        console.log("Response:", result);
        
    } catch (error) {
        console.error("Upload test failed:", error.message);
    }
};

testUpload();