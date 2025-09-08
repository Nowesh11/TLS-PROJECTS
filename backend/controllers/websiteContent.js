const WebsiteContent = require("../models/WebsiteContent");
const WebsiteContentSection = require("../models/WebsiteContentSection");
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { normalizePageName, loadHtmlFromFile } = require("../utils/utils");
const translationService = require("../utils/translationService");

// @desc    Get all website content for a specific page
// @route   GET /api/website-content/:page
// @access  Public
const getPageContent = asyncHandler(async (req, res) => {
    const { page } = req.params;
    const { language = "en" } = req.query;

    const content = await WebsiteContent.find({
        page,
        isActive: true,
        isVisible: true
    }).sort({ order: 1 });

    // Transform content to bilingual key-value structure
    const bilingualContent = {};
    
    content.forEach(item => {
        const key = item.sectionKey || `${item.section}-${item._id}`;
        
        bilingualContent[key] = {
            en: {
                title: item.title?.en || '',
                content: item.content?.en || '',
                subtitle: item.subtitle?.en || '',
                buttonText: item.buttonText?.en || ''
            },
            ta: {
                title: item.title?.ta || '',
                content: item.content?.ta || '',
                subtitle: item.subtitle?.ta || '',
                buttonText: item.buttonText?.ta || ''
            },
            metadata: item.metadata,
            image: item.image,
            images: item.images?.map(img => ({
                url: img.url,
                alt: {
                    en: img.alt?.en || '',
                    ta: img.alt?.ta || ''
                },
                caption: {
                    en: img.caption?.en || '',
                    ta: img.caption?.ta || ''
                },
                order: img.order
            })) || [],
            buttonUrl: item.buttonUrl,
            order: item.order
        };
    });

    res.json({
        success: true,
        data: bilingualContent
    });
});

// @desc    Get all website content (for admin)
// @route   GET /api/website-content
// @access  Private/Admin
const getAllContent = asyncHandler(async (req, res) => {
    const { page, section, search } = req.query;
    
    let query = {};
    
    if (page) query.page = page;
    if (section) query.section = section;
    
    if (search) {
        query.$or = [
            { "title.en": { $regex: search, $options: "i" } },
            { "title.ta": { $regex: search, $options: "i" } },
            { "content.en": { $regex: search, $options: "i" } },
            { "content.ta": { $regex: search, $options: "i" } }
        ];
    }

    const content = await WebsiteContent.find(query)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ page: 1, order: 1 });

    res.json({
        success: true,
        count: content.length,
        data: content
    });
});

// @desc    Get single content item
// @route   GET /api/website-content/item/:id
// @access  Private/Admin
const getContentById = asyncHandler(async (req, res) => {
    const content = await WebsiteContent.findById(req.params.id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

    if (!content) {
        res.status(404);
        throw new Error("Content not found");
    }

    res.json({
        success: true,
        data: content
    });
});

// @desc    Create new content
// @route   POST /api/website-content
// @access  Private/Admin
const createContent = asyncHandler(async (req, res) => {
    const contentData = {
        ...req.body,
        createdBy: req.user._id
    };

    // Validate bilingual content before processing
    const validationErrors = WebsiteContent.validateBilingualContent(contentData);
    if (validationErrors.length > 0) {
        res.status(400);
        throw new Error(`Bilingual validation failed: ${validationErrors.join(', ')}`);
    }

    // Auto-translate English content to Tamil if Tamil fields are empty
    if (req.body.autoTranslate !== false) {
        const translatedFields = await translationService.translateContentObject(contentData);
        
        // Only add translated fields if they don't already exist
        Object.keys(translatedFields).forEach(key => {
            if (!contentData[key] || contentData[key].trim() === "") {
                contentData[key] = translatedFields[key];
            }
        });
        
        // Set translation flag
        if (Object.keys(translatedFields).length > 0) {
            contentData.hasTamilTranslation = true;
        }
    }

    // Final validation after auto-translation
    const finalValidationErrors = WebsiteContent.validateBilingualContent(contentData);
    if (finalValidationErrors.length > 0) {
        res.status(400);
        throw new Error(`Content must have both English and Tamil translations: ${finalValidationErrors.join(', ')}`);
    }

    const content = await WebsiteContent.create(contentData);

    res.status(201).json({
        success: true,
        data: content,
        message: 'Content created successfully with bilingual validation'
    });
});

// @desc    Update content
// @route   PUT /api/website-content/:id
// @access  Private/Admin
const updateContent = asyncHandler(async (req, res) => {
    let content = await WebsiteContent.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error("Content not found");
    }

    const updateData = {
        ...req.body,
        updatedBy: req.user._id
    };

    // Validate bilingual content before processing
    const validationErrors = WebsiteContent.validateBilingualContent(updateData);
    if (validationErrors.length > 0) {
        res.status(400);
        throw new Error(`Bilingual validation failed: ${validationErrors.join(', ')}`);
    }

    // Auto-translate English content to Tamil if Tamil fields are empty or auto-translate is requested
    if (req.body.autoTranslate !== false) {
        const translatedFields = await translationService.translateContentObject(updateData);
        
        // Only add translated fields if they don't already exist or are empty
        Object.keys(translatedFields).forEach(key => {
            if (!updateData[key] || updateData[key].trim() === "") {
                updateData[key] = translatedFields[key];
            }
        });
        
        // Set translation flag
        if (Object.keys(translatedFields).length > 0) {
            updateData.hasTamilTranslation = true;
        }
    }

    // Final validation after auto-translation
    const finalValidationErrors = WebsiteContent.validateBilingualContent(updateData);
    if (finalValidationErrors.length > 0) {
        res.status(400);
        throw new Error(`Content must have both English and Tamil translations: ${finalValidationErrors.join(', ')}`);
    }

    content = await WebsiteContent.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );

    res.json({
        success: true,
        data: content,
        message: 'Content updated successfully with bilingual validation'
    });
});

// @desc    Delete content
// @route   DELETE /api/website-content/:id
// @access  Private/Admin
const deleteContent = asyncHandler(async (req, res) => {
    const content = await WebsiteContent.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error("Content not found");
    }

    await content.deleteOne();

    res.json({
        success: true,
        message: "Content deleted successfully"
    });
});

// @desc    Bulk update content order
// @route   PUT /api/website-content/reorder
// @access  Private/Admin
const reorderContent = asyncHandler(async (req, res) => {
    const { items } = req.body; // Array of {id, order}

    const updatePromises = items.map(item =>
        WebsiteContent.findByIdAndUpdate(
            item.id,
            { order: item.order, updatedBy: req.user._id },
            { new: true }
        )
    );

    await Promise.all(updatePromises);

    res.json({
        success: true,
        message: "Content order updated successfully"
    });
});

// @desc    Toggle content visibility
// @route   PUT /api/website-content/:id/toggle-visibility
// @access  Private/Admin
const toggleVisibility = asyncHandler(async (req, res) => {
    const content = await WebsiteContent.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error("Content not found");
    }

    content.isVisible = !content.isVisible;
    content.updatedBy = req.user._id;
    await content.save();

    res.json({
        success: true,
        data: content
    });
});

// @desc    Get content structure for a page (sections and their content types)
// @route   GET /api/website-content/structure/:page
// @access  Public
const getPageStructure = asyncHandler(async (req, res) => {
    const { page } = req.params;

    const structure = await WebsiteContent.aggregate([
        {
            $match: {
                page,
                isActive: true,
                isVisible: true
            }
        },
        {
            $group: {
                _id: "$section",
                items: {
                    $push: {
                        id: "$_id",
                        title: "$title",
                        titleTamil: "$titleTamil",
                        order: "$order"
                    }
                }
            }
        },
        {
            $sort: { "_id": 1 }
        }
    ]);

    res.json({
        success: true,
        data: structure
    });
});

// @desc    Bulk update page content
// @route   POST /api/website-content/bulk-update
// @access  Private/Admin
const bulkUpdateContent = asyncHandler(async (req, res) => {
    const { page, sections } = req.body;

    if (!page || !sections || !Array.isArray(sections)) {
        res.status(400);
        throw new Error("Page and sections array are required");
    }

    const updatePromises = sections.map(async (sectionData) => {
        const { _id, ...updateData } = sectionData;
        
        // Process content structure for multilingual support
        const processedData = {
            ...updateData,
            updatedBy: req.user._id,
            // Handle Tamil content structure
            content: {
                english: updateData.content || "",
                tamil: {
                    title: updateData.title_tamil || "",
                    subtitle: updateData.subtitle_tamil || "",
                    content: updateData.content_tamil || "",
                    buttonText: updateData.buttonText_tamil || ""
                }
            },
            // Handle metadata
            metadata: {
                ...updateData.metadata,
                email: updateData.email,
                phone: updateData.phone,
                address: updateData.address,
                address_tamil: updateData.address_tamil,
                imageAlt: updateData.imageAlt,
                navItems: updateData.navItems ? JSON.parse(updateData.navItems) : undefined
            }
        };

        // Clean up temporary fields
        delete processedData.title_tamil;
        delete processedData.subtitle_tamil;
        delete processedData.content_tamil;
        delete processedData.buttonText_tamil;
        delete processedData.email;
        delete processedData.phone;
        delete processedData.address;
        delete processedData.address_tamil;
        delete processedData.imageAlt;
        delete processedData.navItems;

        if (_id) {
            return WebsiteContent.findByIdAndUpdate(_id, processedData, { new: true });
        } else {
            return WebsiteContent.create({ ...processedData, page, createdBy: req.user._id });
        }
    });

    const updatedSections = await Promise.all(updatePromises);

    res.json({
        success: true,
        message: "Page content updated successfully",
        data: updatedSections
    });
});

// @desc    Duplicate a content section
// @route   POST /api/website-content/:id/duplicate
// @access  Private/Admin
const duplicateContent = asyncHandler(async (req, res) => {
    const originalContent = await WebsiteContent.findById(req.params.id);

    if (!originalContent) {
        res.status(404);
        throw new Error("Content not found");
    }

    // Create a copy with modified title and order
    const duplicateData = {
        ...originalContent.toObject(),
        title: `${originalContent.title} (Copy)`,
        section: `${originalContent.section}_copy`,
        order: originalContent.order + 1,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Remove the original _id and version fields
    delete duplicateData._id;
    delete duplicateData.__v;

    const duplicatedContent = await WebsiteContent.create(duplicateData);

    res.status(201).json({
        success: true,
        message: "Content duplicated successfully",
        data: duplicatedContent
    });
});

// @desc    Get content statistics
// @route   GET /api/website-content/stats
// @access  Private/Admin
const getContentStats = asyncHandler(async (req, res) => {
    const stats = await WebsiteContent.aggregate([
        {
            $group: {
                _id: null,
                totalContent: { $sum: 1 },
                activeContent: {
                    $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                },
                visibleContent: {
                    $sum: { $cond: [{ $eq: ["$isVisible", true] }, 1, 0] }
                },
                pageBreakdown: {
                    $push: {
                        page: "$page",
                        isActive: "$isActive",
                        isVisible: "$isVisible"
                    }
                }
            }
        }
    ]);

    const pageStats = await WebsiteContent.aggregate([
        {
            $group: {
                _id: "$page",
                count: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                },
                visible: {
                    $sum: { $cond: [{ $eq: ["$isVisible", true] }, 1, 0] }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            overview: stats[0] || {
                totalContent: 0,
                activeContent: 0,
                visibleContent: 0
            },
            byPage: pageStats
        }
    });
});

// @desc    Search content across all pages
// @route   GET /api/website-content/search
// @access  Private/Admin
const searchContent = asyncHandler(async (req, res) => {
    const { q, page, type, status } = req.query;

    if (!q) {
        res.status(400);
        throw new Error("Search query is required");
    }

    let query = {
        $or: [
            { title: { $regex: q, $options: "i" } },
            { content: { $regex: q, $options: "i" } },
            { section: { $regex: q, $options: "i" } },
            { "content.english": { $regex: q, $options: "i" } },
            { "content.tamil.title": { $regex: q, $options: "i" } },
            { "content.tamil.content": { $regex: q, $options: "i" } }
        ]
    };

    if (page) query.page = page;
    if (type) query.type = type;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const results = await WebsiteContent.find(query)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ updatedAt: -1 })
        .limit(50);

    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

// @desc    Get available content types and their configurations
// @route   GET /api/website-content/types
// @access  Private/Admin
const getContentTypes = asyncHandler(async (req, res) => {
    const contentTypes = [
        {
            type: "hero",
            name: "Hero Section",
            description: "Large banner section with title, subtitle, button, and background image",
            icon: "fas fa-star",
            fields: ["title", "subtitle", "buttonText", "buttonUrl", "image"]
        },
        {
            type: "text",
            name: "Text Content",
            description: "Simple text content section",
            icon: "fas fa-align-left",
            fields: ["title", "content"]
        },
        {
            type: "image-text",
            name: "Image + Text",
            description: "Combined image and text content",
            icon: "fas fa-image",
            fields: ["title", "content", "image", "imageAlt"]
        },
        {
            type: "gallery",
            name: "Image Gallery",
            description: "Collection of images in a gallery layout",
            icon: "fas fa-images",
            fields: ["title", "images"]
        },
        {
            type: "features",
            name: "Features List",
            description: "List of features or services",
            icon: "fas fa-list-ul",
            fields: ["title", "content", "metadata"]
        },
        {
            type: "statistics",
            name: "Statistics",
            description: "Numerical statistics display",
            icon: "fas fa-chart-bar",
            fields: ["title", "metadata"]
        },
        {
            type: "contact-info",
            name: "Contact Information",
            description: "Contact details and information",
            icon: "fas fa-address-book",
            fields: ["title", "metadata"]
        },
        {
            type: "navigation",
            name: "Navigation Menu",
            description: "Website navigation menu",
            icon: "fas fa-bars",
            fields: ["metadata"]
        }
    ];

    res.json({
        success: true,
        data: contentTypes
    });
});

// Helper function to scrape and save website content
const scrapeAndSave = async (page, baseUrl = process.env.PUBLIC_WEBSITE_URL || "http://localhost:8080") => {
    try {
        // Map page names to actual HTML files
        const pageMap = {
            "home": "index.html",
            "about": "about.html",
            "contact": "contact.html",
            "books": "books.html",
            "ebooks": "ebooks.html",
            "projects": "projects.html"
        };
        
        const fileName = pageMap[page] || "index.html";
        const url = `${baseUrl}/${fileName}`;
        
        console.log(`🔍 Scraping content from: ${url}`);
        
        // Enhanced axios configuration with timeout and error handling
        const response = await axios.get(url, {
            timeout: 10000, // 10 second timeout
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract title with multiple fallbacks
        let title = $("title").text().trim();
        if (!title) {
            title = $("h1").first().text().trim();
        }
        if (!title) {
            title = page.charAt(0).toUpperCase() + page.slice(1) + " Page";
        }
        
        // Enhanced content extraction with multiple strategies
        let contentSections = [];
        
        // Strategy 1: Extract content from specific page sections
        const sectionSelectors = [
            ".hero",
            ".features", 
            ".stats",
            ".announcements-section",
            "section",
            ".section",
            "main",
            ".main-content",
            "#main-content",
            ".content",
            "#content",
            "article"
        ];
        
        // Strategy 1: Extract individual sections from the page
        let sectionsFound = false;
        
        for (const selector of sectionSelectors) {
            const sections = $(selector);
            if (sections.length > 0) {
                sections.each((i, section) => {
                    const $section = $(section);
                    const sectionText = $section.text().trim();
                    
                    // Skip if section is too small or empty
                    if (sectionText.length < 50) return;
                    
                    // Get section class or id for naming
                    let sectionName = $section.attr("class") || $section.attr("id") || `section-${i + 1}`;
                    if (sectionName.includes(" ")) {
                        sectionName = sectionName.split(" ")[0]; // Take first class name
                    }
                    
                    // Find section title with multiple heading selectors
                    let sectionTitle = $section.find("h1, h2, h3, h4, .title, .heading, .section-title").first().text().trim();
                    
                    // Fallback title generation
                    if (!sectionTitle) {
                        const firstWords = sectionText.split(" ").slice(0, 5).join(" ");
                        sectionTitle = firstWords.length > 30 ? firstWords.substring(0, 30) + "..." : firstWords;
                    }
                    
                    const sectionContent = $section.html();
                    
                    if (sectionContent && sectionContent.length > 20) {
                        // Smart content truncation - try to break at sentence boundaries
                        let truncatedContent = sectionContent;
                        if (sectionContent.length > 4000) {
                            const sentences = sectionContent.split(/[.!?]+/);
                            let result = "";
                            for (const sentence of sentences) {
                                if ((result + sentence).length > 3800) break;
                                result += sentence + ".";
                            }
                            truncatedContent = result || sectionContent.substring(0, 4000) + "...";
                        }
                            
                        contentSections.push({
                            section: sectionName,
                            title: sectionTitle,
                            content: truncatedContent
                        });
                        sectionsFound = true;
                    }
                });
                
                if (sectionsFound) {
                    console.log(`✅ Found ${contentSections.length} sections using selector: ${selector}`);
                    break;
                }
            }
        }
        
        
        // Strategy 2: Extract main content area if no sections found
        if (!sectionsFound) {
            console.log("⚠️ No sections found, trying to extract main content");
            
            const contentSelectors = [
                "main", ".main", "#main", ".content", "#content",
                ".main-content", "#main-content", ".page-content",
                ".entry-content", ".post-content", "article",
                ".container .row", ".container", "body"
            ];
            
            let mainContent = "";
            let $content = null;
            
            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    // Remove unwanted elements from this content area
                    const $clone = element.clone();
                    $clone.find("script, style, nav, header, footer, .nav, .header, .footer").remove();
                    
                    const textContent = $clone.text().trim();
                    if (textContent.length > 200) { // Minimum content threshold
                        mainContent = $clone.html();
                        $content = cheerio.load(mainContent);
                        console.log(`✅ Found main content using selector: ${selector} (${textContent.length} characters)`);
                        break;
                    }
                }
            }
            
            if (mainContent) {
                if (mainContent.length > 4000) {
                    // Split by headings first
                    const headings = $content("h1, h2, h3, h4, h5, h6");
                    if (headings.length > 1) {
                        let currentSection = "";
                        let currentTitle = "main";
                        
                        $content("*").each((i, element) => {
                            const $el = $content(element);
                            const tagName = element.tagName?.toLowerCase();
                            
                            if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
                                // Save previous section if it has content
                                if (currentSection.trim().length > 50) {
                                    contentSections.push({
                                        section: currentTitle,
                                        content: currentSection.length > 4000 ? 
                                            currentSection.substring(0, 4000) + "..." : currentSection
                                    });
                                }
                                // Start new section
                                currentTitle = $el.text().trim() || `section-${contentSections.length + 1}`;
                                currentSection = $el.prop("outerHTML") || "";
                            } else {
                                currentSection += $el.prop("outerHTML") || "";
                            }
                        });
                        
                        // Add the last section
                        if (currentSection.trim().length > 50) {
                            contentSections.push({
                                section: currentTitle,
                                content: currentSection.length > 4000 ? 
                                    currentSection.substring(0, 4000) + "..." : currentSection
                            });
                        }
                    } else {
                        // Split by paragraphs if content is very large
                        const chunks = [];
                        const paragraphs = $content("p, div");
                        let currentChunk = "";
                        
                        paragraphs.each((i, p) => {
                            const pContent = $content(p).prop("outerHTML") || "";
                            if ((currentChunk + pContent).length > 3500) {
                                if (currentChunk.trim()) {
                                    chunks.push(currentChunk);
                                }
                                currentChunk = pContent;
                            } else {
                                currentChunk += pContent;
                            }
                        });
                        
                        if (currentChunk.trim()) {
                            chunks.push(currentChunk);
                        }
                        
                        chunks.forEach((chunk, index) => {
                            if (chunk.trim().length > 50) {
                                contentSections.push({
                                    section: index === 0 ? "main" : `section-${index + 1}`,
                                    content: chunk
                                });
                            }
                        });
                    }
                } else {
                    // Content is small enough, use as single section
                    contentSections.push({
                        section: "main",
                        content: mainContent
                    });
                }
            }
        }
        
        // Strategy 3: Enhanced fallback to body content extraction
        if (contentSections.length === 0) {
            console.log("⚠️ No main content found, falling back to body extraction");
            
            // Remove unwanted elements more comprehensively
            const unwantedSelectors = [
                "script", "style", "nav", "header", "footer", "aside",
                ".nav", ".header", ".footer", ".sidebar", ".menu",
                ".navigation", ".breadcrumb", ".pagination", ".ads",
                ".advertisement", ".social-share", ".comments",
                "[class*=\"nav\"]", "[id*=\"nav\"]", "[class*=\"menu\"]",
                ".skip-link", ".screen-reader-text"
            ];
            
            unwantedSelectors.forEach(selector => {
                $(selector).remove();
            });
            
            // Try to find meaningful content in body
            const meaningfulSelectors = [
                ".content", ".main", ".primary", ".post", ".article",
                ".entry", ".page", "main", "article", "[role=\"main\"]"
            ];
            
            let bodyContent = "";
            for (const selector of meaningfulSelectors) {
                const element = $(selector);
                if (element.length > 0 && element.text().trim().length > 100) {
                    bodyContent = element.html();
                    console.log(`✅ Found body content using selector: ${selector}`);
                    break;
                }
            }
            
            // If still no content, get entire body but clean it
            if (!bodyContent) {
                bodyContent = $("body").html() || "";
                // Clean up common unwanted patterns
                bodyContent = bodyContent.replace(/<script[^>]*>.*?<\/script>/gis, "");
                bodyContent = bodyContent.replace(/<style[^>]*>.*?<\/style>/gis, "");
                bodyContent = bodyContent.replace(/<!--.*?-->/gs, "");
            }
            
            if (bodyContent && bodyContent.length > 100) {
                // Smart truncation for body content
                let truncatedContent = bodyContent;
                if (bodyContent.length > 4000) {
                    const sentences = bodyContent.split(/[.!?]+/);
                    let result = "";
                    for (const sentence of sentences) {
                        if ((result + sentence).length > 3800) break;
                        result += sentence + ".";
                    }
                    truncatedContent = result || bodyContent.substring(0, 4000) + "...";
                }
                
                contentSections.push({
                    section: "main",
                    content: truncatedContent
                });
                console.log(`✅ Extracted content from body (${truncatedContent.length} characters)`);
            }
        }
        
        // Strategy 4: Enhanced placeholder content with page-specific information
        if (contentSections.length === 0) {
            console.log("⚠️ No content extracted, creating enhanced placeholder");
            
            const pageTemplates = {
                "home": {
                    title: "Welcome to Our Website",
                    content: "<div class=\"placeholder-content\"><h1>Welcome to Our Website</h1><p>We are currently updating our homepage content. Please check back soon for the latest information about our services and offerings.</p><p>In the meantime, feel free to explore our other pages or contact us directly.</p></div>"
                },
                "about": {
                    title: "About Us",
                    content: "<div class=\"placeholder-content\"><h1>About Us</h1><p>We are currently updating our about page content. Please check back soon to learn more about our company, mission, and team.</p></div>"
                },
                "contact": {
                    title: "Contact Information",
                    content: "<div class=\"placeholder-content\"><h1>Contact Us</h1><p>We are currently updating our contact information. Please check back soon for the latest contact details and office hours.</p></div>"
                },
                "books": {
                    title: "Our Books Collection",
                    content: "<div class=\"placeholder-content\"><h1>Books Collection</h1><p>We are currently updating our books catalog. Please check back soon to browse our latest collection of books and publications.</p></div>"
                },
                "ebooks": {
                    title: "Digital Books Library",
                    content: "<div class=\"placeholder-content\"><h1>E-Books Library</h1><p>We are currently updating our digital library. Please check back soon to access our collection of e-books and digital publications.</p></div>"
                },
                "projects": {
                    title: "Our Projects",
                    content: "<div class=\"placeholder-content\"><h1>Our Projects</h1><p>We are currently updating our projects showcase. Please check back soon to explore our latest work and achievements.</p></div>"
                }
            };
            
            const template = pageTemplates[page] || {
                title: `${page.charAt(0).toUpperCase() + page.slice(1)} Page`,
                content: `<div class="placeholder-content"><h1>${page.charAt(0).toUpperCase() + page.slice(1)}</h1><p>Content for the ${page} page is being updated. Please check back later for the latest information.</p></div>`
            };
            
            contentSections.push({
                section: "main",
                content: template.content
            });
        }
        
        // Find or create an admin user for the createdBy field
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            adminUser = await User.findOne().sort({ createdAt: 1 });
        }
        
        // Save all sections to database
        const savedContent = [];
        for (let i = 0; i < contentSections.length; i++) {
            const section = contentSections[i];
            
            const contentData = {
                page,
                section: section.section,
                sectionKey: `${page}_${section.section}`,
                title: section.title || (i === 0 ? title : `${title} - ${section.section}`),
                content: section.content,
                order: i + 1,
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id,
                updatedBy: adminUser._id
            };
            
            const saved = await WebsiteContent.create(contentData);
            savedContent.push({
                id: saved._id,
                page,
                title: contentData.title,
                content: section.content,
                last_updated: saved.createdAt
            });
        }
        
        console.log(`✅ Successfully scraped and saved ${savedContent.length} content sections for page: ${page}`);
        
        return savedContent;
        
    } catch (error) {
        console.error(`❌ Error scraping content for page ${page}:`, error.message);
        
        // Create fallback error content
        try {
            let adminUser = await User.findOne({ role: "admin" });
            if (!adminUser) {
                adminUser = await User.findOne().sort({ createdAt: 1 });
            }
            
            // Enhanced page-specific error templates
            const pageErrorTemplates = {
                "home": {
                    title: "Welcome to Our Website",
                    content: "<div class=\"error-content\"><h1>Welcome to Our Website</h1><p>We are experiencing technical difficulties accessing our homepage content. Our team is working to resolve this issue.</p><p>Please try refreshing the page or contact us if the problem persists.</p></div>"
                },
                "about": {
                    title: "About Us",
                    content: "<div class=\"error-content\"><h1>About Us</h1><p>We are experiencing technical difficulties accessing our about page content. Please try again later or contact us directly for information about our company.</p></div>"
                },
                "contact": {
                    title: "Contact Information",
                    content: "<div class=\"error-content\"><h1>Contact Us</h1><p>We are experiencing technical difficulties accessing our contact information. Please try again later or reach out to us through alternative channels.</p></div>"
                },
                "books": {
                    title: "Our Books Collection",
                    content: "<div class=\"error-content\"><h1>Books Collection</h1><p>We are experiencing technical difficulties accessing our books catalog. Please try again later to browse our collection.</p></div>"
                },
                "ebooks": {
                    title: "Digital Books Library",
                    content: "<div class=\"error-content\"><h1>E-Books Library</h1><p>We are experiencing technical difficulties accessing our digital library. Please try again later to access our e-books collection.</p></div>"
                },
                "projects": {
                    title: "Our Projects",
                    content: "<div class=\"error-content\"><h1>Our Projects</h1><p>We are experiencing technical difficulties accessing our projects showcase. Please try again later to explore our work.</p></div>"
                }
            };
            
            const template = pageErrorTemplates[page] || {
                title: `${page.charAt(0).toUpperCase() + page.slice(1)} Page`,
                content: `<div class="error-content"><h1>${page.charAt(0).toUpperCase() + page.slice(1)}</h1><p>Content temporarily unavailable. Error: ${error.message}</p><p>Please try again later or contact support.</p></div>`
            };
            
            const errorContent = {
                page,
                section: "main",
                sectionKey: `${page}_main`,
                title: template.title,
                content: template.content,
                order: 1,
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id,
                updatedBy: adminUser._id,
                metadata: {
                    isErrorFallback: true,
                    originalError: error.message,
                    errorCreated: new Date()
                }
            };
            
            const saved = await WebsiteContent.create(errorContent);
            console.log(`💾 Saved fallback error content for page: ${page}`);
            
            return [{
                id: saved._id,
                page,
                title: errorContent.title,
                content: errorContent.content,
                last_updated: saved.createdAt,
                error: true
            }];
            
        } catch (saveError) {
            console.error("❌ Failed to save fallback content:", saveError.message);
            throw error; // Re-throw original error
        }
    }
};

// Helper function to create fallback content when scraping fails
const createFallbackContent = async (page) => {
    try {
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            adminUser = await User.findOne().sort({ createdAt: 1 });
        }
        
        const pageTemplates = {
            "home": {
                title: "Tamil Language Society - தமிழ்ப் பேரவை",
                content: "<div class=\"fallback-content\"><h1>Welcome to Tamil Language Society</h1><p>தமிழ்ப் பேரவை - Preserving and promoting the beautiful Tamil language and culture for future generations.</p><p>Our services include digital books, cultural projects, bookstore, and community engagement.</p></div>"
            },
            "about": {
                title: "About Us - எங்களைப் பற்றி",
                content: "<div class=\"fallback-content\"><h1>About Tamil Language Society</h1><p>We are dedicated to preserving and promoting Tamil language and culture.</p></div>"
            },
            "contact": {
                title: "Contact Us - தொடர்பு",
                content: "<div class=\"fallback-content\"><h1>Contact Information</h1><p>Get in touch with Tamil Language Society for more information about our services.</p></div>"
            },
            "books": {
                title: "Book Store - புத்தக கடை",
                content: "<div class=\"fallback-content\"><h1>Tamil Book Store</h1><p>Browse our collection of authentic Tamil literature and educational materials.</p></div>"
            },
            "ebooks": {
                title: "Digital Library - மின்னூல் நூலகம்",
                content: "<div class=\"fallback-content\"><h1>Tamil E-Books Library</h1><p>Access thousands of Tamil books and educational resources in our digital collection.</p></div>"
            },
            "projects": {
                title: "Our Projects - எங்கள் திட்டங்கள்",
                content: "<div class=\"fallback-content\"><h1>Tamil Cultural Projects</h1><p>Join our initiatives and events that celebrate Tamil heritage and traditions.</p></div>"
            }
        };
        
        const template = pageTemplates[page] || {
            title: `${page.charAt(0).toUpperCase() + page.slice(1)} Page`,
            content: `<div class="fallback-content"><h1>${page.charAt(0).toUpperCase() + page.slice(1)}</h1><p>Content for this page is currently being updated.</p></div>`
        };
        
        const fallbackData = {
            page,
            section: "main",
            sectionKey: `${page}_main`,
            title: template.title,
            content: template.content,
            order: 1,
            isActive: true,
            isVisible: true,
            createdBy: adminUser._id,
            updatedBy: adminUser._id,
            metadata: {
                isFallback: true,
                created: new Date()
            }
        };
        
        const saved = await WebsiteContent.create(fallbackData);
        console.log(`💾 Created fallback content for page: ${page}`);
        
        return [{
            id: saved._id,
            page,
            title: template.title,
            content: template.content,
            last_updated: saved.createdAt,
            fallback: true
        }];
        
    } catch (error) {
        console.error("❌ Failed to create fallback content:", error.message);
        return [{
            id: "fallback",
            page,
            title: `${page.charAt(0).toUpperCase() + page.slice(1)} Page`,
            content: "<div class=\"error-content\"><h1>Content Unavailable</h1><p>We're experiencing technical difficulties. Please try again later.</p></div>",
            last_updated: new Date(),
            error: true
        }];
    }
};

// @desc    Get simple page content (for CMS requirements)
// @route   GET /api/website-content/simple
// @access  Public
const getSimplePageContent = asyncHandler(async (req, res) => {
    const { page = "home" } = req.query;
    
    console.log(`📄 Fetching content for page: ${page}`);

    // First, try to get content from database
    const content = await WebsiteContent.find({
        page,
        isActive: true,
        isVisible: true
    }).sort({ order: 1 });

    // If no content found in database, use scraper fallback
    if (!content || content.length === 0) {
        console.log(`🔄 No content found in database for page '${page}', initiating fallback scraping...`);
        
        try {
            const scrapedContent = await scrapeAndSave(page);
            
            // Return the scraped content immediately
            res.json({
                success: true,
                data: scrapedContent,
                message: `Content scraped and saved for page '${page}'`,
                scraped: true
            });
            return;
        } catch (error) {
            console.error(`❌ Scraping failed for page '${page}':`, error.message);
            
            // Create fallback content if scraping fails
            const fallbackContent = await createFallbackContent(page);
            
            res.json({
                success: true,
                data: fallbackContent,
                message: `Fallback content provided for page '${page}'`,
                fallback: true
            });
            return;
        }
    }

    // Transform existing database content to simple structure
    const simpleContent = content.map(item => ({
        id: item._id,
        page: item.page,
        section: item.section,
        sectionKey: item.sectionKey,
        sectionType: item.sectionType,
        title: item.title,
        content: item.content,
        order: item.order,
        layout: item.layout,
        isActive: item.isActive,
        isVisible: item.isVisible,
        last_updated: item.updatedAt
    }));

    console.log(`✅ Loaded ${simpleContent.length} content items from database for page '${page}'`);
    console.log("📊 Content preview:", simpleContent.slice(0, 3).map(item => ({ id: item.id, title: item.title })));

    // Add cache-busting headers to prevent browser caching issues
    res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    });

    res.json({
        success: true,
        data: simpleContent,
        message: "Website content loaded from database",
        count: simpleContent.length,
        timestamp: new Date().toISOString()
    });
});

// @desc    Save simple page content (for CMS requirements)
// @route   POST /api/website-content
// @access  Private/Admin
const saveSimplePageContent = asyncHandler(async (req, res) => {
    const { page, section, title, content, id } = req.body;
    
    if (!page) {
        res.status(400);
        throw new Error("Page is required");
    }

    try {
        let savedContent;
        
        if (id) {
            // Update existing content by ID
            const existingContent = await WebsiteContent.findById(id);
            if (!existingContent) {
                res.status(404);
                throw new Error("Content not found");
            }
            
            // Update fields if provided
            if (title !== undefined) existingContent.title = title;
            if (content !== undefined) existingContent.content = content;
            if (section !== undefined) existingContent.section = section;
            
            existingContent.updatedBy = req.user._id;
            savedContent = await existingContent.save();
            
        } else {
            // Find by page and section, or create new
            const sectionName = section || "main";
            const existingContent = await WebsiteContent.findOne({ 
                page, 
                section: sectionName 
            });
            
            if (existingContent) {
                // Update existing content
                if (title !== undefined) existingContent.title = title;
                if (content !== undefined) existingContent.content = content;
                existingContent.updatedBy = req.user._id;
                savedContent = await existingContent.save();
            } else {
                // Create new content
                if (!title || !content) {
                    res.status(400);
                    throw new Error("Title and content are required for new content");
                }
                
                savedContent = await WebsiteContent.create({
                    page,
                    section: sectionName,
                    sectionKey: `${page}_${sectionName}`,
                    title,
                    content,
                    order: 1,
                    isActive: true,
                    isVisible: true,
                    createdBy: req.user._id,
                    updatedBy: req.user._id
                });
            }
        }

        // Return the updated content in the expected format
        const responseData = {
            id: savedContent._id,
            page: savedContent.page,
            section: savedContent.section,
            title: savedContent.title,
            content: savedContent.content,
            last_updated: savedContent.updatedAt
        };

        res.json({
            success: true,
            message: "Content saved successfully",
            data: responseData
        });
        
    } catch (error) {
        console.error("Error saving content:", error);
        res.status(500);
        throw new Error("Failed to save content: " + error.message);
    }
});

// @desc    Update content in real-time (for admin panel)
// @route   PUT /api/website-content
// @access  Private/Admin
const updateContentRealTime = asyncHandler(async (req, res) => {
    const { id, page, section, title, content, type, value } = req.body;

    try {
        let updatedContent;

        if (id) {
            // Update specific content by ID
            const existingContent = await WebsiteContent.findById(id);
            if (!existingContent) {
                res.status(404);
                throw new Error("Content not found");
            }

            // Update fields if provided
            if (title !== undefined) existingContent.title = title;
            if (content !== undefined) existingContent.content = content;
            if (section !== undefined) existingContent.section = section;
            if (page !== undefined) existingContent.page = page;
            
            existingContent.updatedBy = req.user._id;
            updatedContent = await existingContent.save();

        } else if (type && value !== undefined) {
            // Handle global content updates
            const globalContent = await WebsiteContent.findOne({ 
                page: "global", 
                section: type 
            });

            if (globalContent) {
                globalContent.content = value;
                globalContent.updatedBy = req.user._id;
                updatedContent = await globalContent.save();
            } else {
                // Create new global content
                updatedContent = await WebsiteContent.create({
                    page: "global",
                    section: type,
                    sectionKey: `global_${type}`,
                    title: type,
                    content: value,
                    order: 1,
                    isActive: true,
                    isVisible: true,
                    createdBy: req.user._id,
                    updatedBy: req.user._id
                });
            }

        } else if (page && section) {
            // Update by page and section
            const existingContent = await WebsiteContent.findOne({ page, section });
            if (!existingContent) {
                res.status(404);
                throw new Error("Content not found");
            }

            if (title !== undefined) existingContent.title = title;
            if (content !== undefined) existingContent.content = content;
            existingContent.updatedBy = req.user._id;
            updatedContent = await existingContent.save();

        } else {
            res.status(400);
            throw new Error("Either id, or page and section, or type and value must be provided");
        }

        // Return the updated content
        const responseData = {
            id: updatedContent._id,
            page: updatedContent.page,
            section: updatedContent.section,
            title: updatedContent.title,
            content: updatedContent.content,
            isActive: updatedContent.isActive,
            isVisible: updatedContent.isVisible,
            last_updated: updatedContent.updatedAt
        };

        res.json({
            success: true,
            message: "Content updated successfully",
            data: responseData
        });

    } catch (error) {
        console.error("Error updating content:", error);
        res.status(500);
        throw new Error("Failed to update content: " + error.message);
    }
});

// Helper functions for scraping
// Use the shared normalize function from utils
const normalizePage = normalizePageName;

// HTML loading is now handled by the shared utility function
// The loadHtmlFromFile function is imported from utils/utils.js

function extractSections($) {
    // First try to find <section> elements
    let blocks = $("section");
    
    // If no sections found, use fallback div selectors
    if (!blocks.length) {
        blocks = $("div.container, div.row, div[class*=\"section\"], div[class*=\"content\"], div[class*=\"block\"], header, footer, div[data-content], .hero, .about, .features, .statistics, .announcements, .contact");
    }
    
    return blocks;
}

async function scrapeAndUpsertSections(page) {
    try {
        const normalizedPage = normalizePage(page);
        console.log(`[SCRAPER] Processing page: '${page}' → normalized: '${normalizedPage}'`);
        
        const html = loadHtmlFromFile(normalizedPage, __dirname);
        
        // If no HTML found, return early
        if (!html) {
            console.error(`[SCRAPER] No HTML content found for page: ${normalizedPage}`);
            return 0;
        }
        
        const $ = cheerio.load(html);
        const blocks = extractSections($);
        
        if (!blocks.length) {
            console.log(`[SCRAPER] No content blocks found for ${normalizedPage}`);
            return 0;
        }

        const sections = [];
        blocks.each((i, el) => {
            const contentHtml = $.html(el)?.trim();
            if (contentHtml && contentHtml.length > 50) { // Filter out very small content
                // Try to extract a meaningful title from the content
                const $el = $(el);
                const title = $el.find("h1, h2, h3").first().text().trim() || 
                             $el.attr("data-title") || 
                             $el.attr("class") || 
                             `Section ${i + 1}`;
                
                sections.push({
                    pageName: normalizedPage, // Use normalized page name
                    sectionId: `section-${i + 1}`,
                    sectionTitle: title,
                    contentHtml,
                    order: i,
                    isActive: true,
                    isVisible: true
                });
            }
        });

        if (!sections.length) {
            console.log(`[SCRAPER] No valid sections extracted for ${normalizedPage}`);
            return 0;
        }

        // Delete existing sections for this page to ensure clean overwrite
        await WebsiteContentSection.deleteMany({ pageName: normalizedPage });
        console.log(`[SCRAPER] Cleared existing sections for ${normalizedPage}`);

        const ops = sections.map(sec => ({
            updateOne: {
                filter: { pageName: sec.pageName, sectionId: sec.sectionId },
                update: { $set: sec },
                upsert: true
            }
        }));

        const res = await WebsiteContentSection.bulkWrite(ops);
        const upsertedCount = res.upsertedCount || res.modifiedCount || sections.length;
        console.log(`[SCRAPER] ${normalizedPage} → Saved ${upsertedCount} sections to database`);
        return upsertedCount;
    } catch (error) {
        console.error(`[SCRAPER] Error scraping ${page}:`, error.message);
        return 0;
    }
}

// @desc    Get page sections with HTML scraping fallback
// @route   GET /api/website-content/sections?page={page} OR GET /api/website-content/sections/{pageName}
// @access  Public
const getPageSections = asyncHandler(async (req, res) => {
    try {
        // Debug logging for request details
        console.log("[DEBUG] Request headers:", req.headers.authorization ? "Token present" : "No token");
        console.log("[DEBUG] Database URI:", process.env.MONGO_URI);
        console.log("[DEBUG] Database name:", require("mongoose").connection.name);
        
        // Get page name from various possible sources and normalize it
        const rawPage = req.params.pageName || req.params.page || req.query.page;
        const normalizedPage = normalizePage(rawPage);
        
        console.log(`[CONTENT] Loading sections for: '${rawPage}' → normalized: '${normalizedPage}'`);
        console.log("[DEBUG] User role:", req.user ? req.user.role : "No user");
        console.log("[DEBUG] Query filters - isVisible: true");
        
        // Query the WebsiteContentSection model for sections
        let sections = await WebsiteContentSection.find({ 
            pageName: normalizedPage.toLowerCase(), 
            isActive: true,
            isVisible: true 
        }).sort({ order: 1 });
        
        console.log("[DEBUG] Database query result count:", sections.length);

        // If no sections found, try to scrape them from the HTML file
        if (!sections.length) {
            console.log(`[CONTENT] No sections found in database for '${normalizedPage}', scraping from HTML...`);
            const scrapedCount = await scrapeAndUpsertSections(normalizedPage);
            
            if (scrapedCount > 0) {
                console.log(`[CONTENT] Successfully scraped ${scrapedCount} sections for '${normalizedPage}'`);
                sections = await WebsiteContentSection.find({ 
                    pageName: normalizedPage.toLowerCase(), 
                    isActive: true,
                    isVisible: true 
                }).sort({ order: 1 });
                
                console.log("[DEBUG] After scraping, database query result count:", sections.length);
            } else {
                console.log(`[CONTENT] Failed to scrape any sections for '${normalizedPage}'`);
            }
        } else {
            console.log(`[CONTENT] Found ${sections.length} sections in database for '${normalizedPage}'`);
        }

        res.json({
            success: true,
            data: sections,
            count: sections.length,
            page: normalizedPage,
            message: sections.length ? `Loaded ${sections.length} sections for ${normalizedPage}` : `No sections found for ${normalizedPage}`
        });
    } catch (err) {
        console.error("[CONTENT] Error loading sections:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Update or create a specific section
// @route   PUT /api/website-content/sections/:page/:sectionId
// @access  Private/Admin
const updatePageSection = asyncHandler(async (req, res) => {
    const { page, sectionId } = req.params;
    const { sectionTitle, contentHtml, contentTamil, order, layout, isActive, isVisible } = req.body;

    if (!contentHtml) {
        res.status(400);
        throw new Error("Content HTML is required");
    }

    try {
        const updateData = {
            sectionTitle,
            contentHtml,
            contentTamil,
            order,
            layout,
            isActive,
            isVisible,
            updatedBy: req.user._id
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const section = await WebsiteContentSection.updateOrCreateSection(page, sectionId, updateData);

        res.json({
            success: true,
            data: section.getFormattedData(),
            message: "Section updated successfully"
        });
    } catch (error) {
        console.error("Error updating section:", error);
        res.status(500);
        throw new Error("Failed to update section: " + error.message);
    }
});

// @desc    Delete a specific section
// @route   DELETE /api/website-content/sections/:page/:sectionId
// @access  Private/Admin
const deletePageSection = asyncHandler(async (req, res) => {
    const { page, sectionId } = req.params;

    try {
        const section = await WebsiteContentSection.findOneAndDelete({ pageName: page, sectionId });
        
        if (!section) {
            res.status(404);
            throw new Error("Section not found");
        }

        res.json({
            success: true,
            message: "Section deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting section:", error);
        res.status(500);
        throw new Error("Failed to delete section: " + error.message);
    }
});

// @desc    Get a specific section
// @route   GET /api/website-content/sections/:page/:sectionId
// @access  Public
const getPageSection = asyncHandler(async (req, res) => {
    const { page, sectionId } = req.params;

    try {
        const section = await WebsiteContentSection.findOne({ 
            pageName: page, 
            sectionId,
            isActive: true,
            isVisible: true
        });
        
        if (!section) {
            res.status(404);
            throw new Error("Section not found");
        }

        res.json({
            success: true,
            data: section.getFormattedData(),
            message: "Section loaded successfully"
        });
    } catch (error) {
        console.error("Error fetching section:", error);
        res.status(500);
        throw new Error("Failed to fetch section: " + error.message);
    }
});

// @desc    Reorder sections within a page
// @route   PUT /api/website-content/sections/:page/reorder
// @access  Private/Admin
const reorderPageSections = asyncHandler(async (req, res) => {
    const { page } = req.params;
    const { sectionOrders } = req.body; // Array of { sectionId, order }

    if (!Array.isArray(sectionOrders)) {
        res.status(400);
        throw new Error("Section orders must be an array");
    }

    try {
        const updatePromises = sectionOrders.map(({ sectionId, order }) => 
            WebsiteContentSection.findOneAndUpdate(
                { pageName: page, sectionId },
                { order, updatedBy: req.user._id },
                { new: true }
            )
        );

        await Promise.all(updatePromises);

        const updatedSections = await WebsiteContentSection.getPageSections(page);
        const formattedSections = updatedSections.map(section => section.getFormattedData());

        res.json({
            success: true,
            data: formattedSections,
            message: "Sections reordered successfully"
        });
    } catch (error) {
        console.error("Error reordering sections:", error);
        res.status(500);
        throw new Error("Failed to reorder sections: " + error.message);
    }
});

// @desc    Manually refresh content for a specific page
// @route   POST /api/website-content/refresh/:page
// @access  Private/Admin
const refreshPageContent = asyncHandler(async (req, res) => {
    const { page } = req.params;
    const normalizedPage = normalizePage(page);
    
    console.log(`[REFRESH] Manual refresh requested for page: '${page}' → normalized: '${normalizedPage}'`);
    
    try {
        // Force re-scrape by clearing existing sections first
        const deletedCount = await WebsiteContentSection.deleteMany({ pageName: normalizedPage });
        console.log(`[REFRESH] Cleared ${deletedCount.deletedCount} existing sections for '${normalizedPage}'`);
        
        // Scrape fresh content from HTML file
        const scrapedCount = await scrapeAndUpsertSections(normalizedPage);
        
        if (scrapedCount > 0) {
            // Fetch the newly scraped sections
            const freshSections = await WebsiteContentSection.find({ 
                pageName: normalizedPage, 
                isVisible: true 
            }).sort({ order: 1 });
            
            console.log(`[REFRESH] Successfully refreshed ${scrapedCount} sections for '${normalizedPage}'`);
            
            res.json({
                success: true,
                data: freshSections,
                count: scrapedCount,
                page: normalizedPage,
                message: `Content refreshed for ${normalizedPage} with ${scrapedCount} sections`
            });
        } else {
            console.log(`[REFRESH] Failed to scrape any sections for '${normalizedPage}'`);
            res.status(400);
            throw new Error(`Failed to refresh content for page '${normalizedPage}'. No sections could be scraped.`);
        }
    } catch (error) {
        console.error(`[REFRESH] Error refreshing content for '${normalizedPage}':`, error.message);
        res.status(500);
        throw new Error(`Failed to refresh content: ${error.message}`);
    }
});

// @desc    Create a new page section
// @route   POST /api/website-content/sections/:page
// @access  Private/Admin
const createPageSection = asyncHandler(async (req, res) => {
    const { page } = req.params;
    const {
        sectionKey,
        section,
        sectionType,
        layout,
        position,
        title,
        content,
        subtitle,
        buttonText,
        buttonUrl,
        images,
        stylePreset,
        customStyles,
        isRequired,
        hasTamilTranslation
    } = req.body;

    // Handle bilingual content structure - support both nested and flat formats
    const bilingualTitle = title && typeof title === 'object' ? title : {
        en: title || '',
        ta: req.body.titleTamil || ''
    };
    
    const bilingualContent = content && typeof content === 'object' ? content : {
        en: content || '',
        ta: req.body.contentTamil || ''
    };
    
    const bilingualSubtitle = subtitle && typeof subtitle === 'object' ? subtitle : {
        en: subtitle || '',
        ta: req.body.subtitleTamil || ''
    };
    
    const bilingualButtonText = buttonText && typeof buttonText === 'object' ? buttonText : {
        en: buttonText || '',
        ta: req.body.buttonTextTamil || ''
    };

    // Check if section key already exists for this page
    const existingSection = await WebsiteContent.findOne({ page, sectionKey });
    if (existingSection) {
        return res.status(400).json({
            success: false,
            message: `Section with key '${sectionKey}' already exists on page '${page}'`
        });
    }

    // Get the next order number for this page
    const lastSection = await WebsiteContent.findOne({ page }).sort({ order: -1 });
    const nextOrder = lastSection ? lastSection.order + 1 : 1;

    const newSection = await WebsiteContent.create({
        page,
        sectionKey,
        section: section || sectionKey,
        sectionType: sectionType || "text",
        layout: layout || "full-width",
        position: position || 0,
        order: nextOrder,
        title: bilingualTitle,
        content: bilingualContent,
        subtitle: bilingualSubtitle,
        buttonText: bilingualButtonText,
        buttonUrl,
        images,
        stylePreset: stylePreset || "default",
        customStyles,
        isRequired: isRequired || false,
        hasTamilTranslation: hasTamilTranslation || (bilingualTitle.ta || bilingualContent.ta || bilingualSubtitle.ta || bilingualButtonText.ta) ? true : false,
        createdBy: req.user ? req.user.id : null,
        isActive: true,
        isVisible: true
    });

    res.status(201).json({
        success: true,
        message: `Section '${sectionKey}' created successfully on page '${page}'`,
        data: newSection
    });
});

module.exports = {
    getPageContent,
    getAllContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
    toggleVisibility,
    getPageStructure,
    bulkUpdateContent,
    updateContentRealTime,
    duplicateContent,
    getContentStats,
    searchContent,
    getContentTypes,
    getSimplePageContent,
    saveSimplePageContent,
    createFallbackContent,
    // New section-based functions
    getPageSections,
    createPageSection,
    updatePageSection,
    deletePageSection,
    getPageSection,
    reorderPageSections,
    refreshPageContent
};