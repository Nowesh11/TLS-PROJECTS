const fs = require("fs");
const path = require("path");

/**
 * Normalize page names for consistent handling
 * Maps 'index' and '/' to 'home', removes .html extension
 */
function normalizePageName(page) {
    if (!page) return "home";
    const lower = page.toLowerCase().trim();
    if (lower === "index" || lower === "/" || lower === "index.html") return "home";
    return lower.replace(/\.html$/, "").replace(/^\/$/, "home");
}

/**
 * Enhanced HTML file loader with proper path resolution and logging
 * Checks root directory first, then fallback directories
 * @param {string} page - The page name to load
 * @param {string} baseDir - Base directory (defaults to backend directory)
 * @returns {string|null} - HTML content or null if not found
 */
function loadHtmlFromFile(page, baseDir = __dirname) {
    const normalizedPage = normalizePageName(page);
    
    // Define paths to check in priority order
    const pathsToCheck = [
        // Root directory (project root)
        normalizedPage === "home" 
            ? path.resolve(baseDir, "../index.html")
            : path.resolve(baseDir, `../${normalizedPage}.html`),
        // Public directory
        normalizedPage === "home" 
            ? path.resolve(baseDir, "../public/index.html")
            : path.resolve(baseDir, `../public/${normalizedPage}.html`),
        // Dist directory
        normalizedPage === "home" 
            ? path.resolve(baseDir, "../dist/index.html")
            : path.resolve(baseDir, `../dist/${normalizedPage}.html`),
        // Views directory
        normalizedPage === "home" 
            ? path.resolve(baseDir, "../views/index.html")
            : path.resolve(baseDir, `../views/${normalizedPage}.html`)
    ];
    
    console.log(`[PATH-RESOLVER] Looking for HTML file for page '${page}' → normalized: '${normalizedPage}'`);
    
    // Try each path until we find one that exists
    for (const htmlPath of pathsToCheck) {
        console.log(`[PATH-RESOLVER] Checking: ${htmlPath}`);
        
        if (fs.existsSync(htmlPath)) {
            console.log(`✅ Found HTML file for '${normalizedPage}' at: ${htmlPath}`);
            try {
                return fs.readFileSync(htmlPath, "utf8");
            } catch (readError) {
                console.error(`❌ Error reading file at ${htmlPath}:`, readError.message);
                continue; // Try next path
            }
        } else {
            console.log(`❌ No HTML file found at: ${htmlPath}`);
        }
    }
    
    console.error(`[PATH-RESOLVER] HTML file not found for page '${normalizedPage}' in any of ${pathsToCheck.length} locations`);
    console.error("[PATH-RESOLVER] Searched paths:");
    pathsToCheck.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
    
    return null;
}

module.exports = {
    normalizePageName,
    loadHtmlFromFile
};