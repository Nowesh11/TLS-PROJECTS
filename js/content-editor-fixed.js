// Fixed version of content-editor.js with template literals replaced
// This is a test to isolate the syntax error issue

class ContentEditor {
    constructor() {
        console.log("ContentEditor initialized successfully");
    }
    
    async loadPageContent(page) {
        const startTime = performance.now();
        try {
            console.log("Loading page content for: " + page);
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log("Page content loaded successfully");
        } catch (error) {
            const loadTime = performance.now() - startTime;
            console.error("Error loading page content for " + page + ":", {
                error: error.message,
                stack: error.stack,
                page: page,
                loadTime: loadTime.toFixed(2) + "ms",
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
        }
    }
}

// Initialize the content editor
function initializeContentEditor() {
    try {
        const contentEditor = new ContentEditor();
        contentEditor.loadPageContent('global');
        console.log("Content editor initialized successfully");
    } catch (error) {
        console.error("Failed to initialize content editor:", error);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentEditor);
} else {
    initializeContentEditor();
}