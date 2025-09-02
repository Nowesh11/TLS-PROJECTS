// Minimal test version to isolate syntax error
class ContentEditor {
    async loadPageContent(page) {
        const startTime = performance.now();
        console.log(`Starting load for page: ${page}`);
        
        try {
            // Minimal try block
            console.log('In try block');
        } catch (error) {
            const loadTime = performance.now() - startTime;
            console.error(`Error loading page content for ${page}:`, {
                error: error.message,
                stack: error.stack,
                page: page,
                loadTime: `${loadTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Initialize
const contentEditor = new ContentEditor();
contentEditor.loadPageContent('global');