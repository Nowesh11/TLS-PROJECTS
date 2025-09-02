const axios = require("axios");
const asyncHandler = require("express-async-handler");

/**
 * Translation service for English to Tamil translation
 * Uses Google Translate API as the primary service
 */
class TranslationService {
    constructor() {
        this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        this.baseUrl = "https://translation.googleapis.com/language/translate/v2";
        this.sourceLang = "en";
        this.targetLang = "ta";
    }

    /**
     * Translate text from English to Tamil
     * @param {string} text - Text to translate
     * @returns {Promise<string>} - Translated text
     */
    async translateText(text) {
        if (!text || typeof text !== "string" || text.trim() === "") {
            return "";
        }

        // Skip translation if text is already in Tamil (contains Tamil characters)
        if (this.containsTamilCharacters(text)) {
            return text;
        }

        try {
            if (!this.apiKey) {
                console.warn("Google Translate API key not configured. Skipping translation.");
                return text; // Return original text if no API key
            }

            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
                q: text,
                source: this.sourceLang,
                target: this.targetLang,
                format: "text"
            });

            if (response.data && response.data.data && response.data.data.translations) {
                return response.data.data.translations[0].translatedText;
            }

            return text; // Return original if translation fails
        } catch (error) {
            console.error("Translation error:", error.message);
            return text; // Return original text on error
        }
    }

    /**
     * Translate HTML content while preserving HTML tags
     * @param {string} htmlContent - HTML content to translate
     * @returns {Promise<string>} - Translated HTML content
     */
    async translateHtmlContent(htmlContent) {
        if (!htmlContent || typeof htmlContent !== "string" || htmlContent.trim() === "") {
            return "";
        }

        // Skip translation if content is already in Tamil
        if (this.containsTamilCharacters(htmlContent)) {
            return htmlContent;
        }

        try {
            if (!this.apiKey) {
                console.warn("Google Translate API key not configured. Skipping HTML translation.");
                return htmlContent;
            }

            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
                q: htmlContent,
                source: this.sourceLang,
                target: this.targetLang,
                format: "html"
            });

            if (response.data && response.data.data && response.data.data.translations) {
                return response.data.data.translations[0].translatedText;
            }

            return htmlContent;
        } catch (error) {
            console.error("HTML translation error:", error.message);
            return htmlContent;
        }
    }

    /**
     * Translate content object with multiple fields
     * @param {Object} contentObj - Object containing content fields to translate
     * @returns {Promise<Object>} - Object with translated Tamil fields
     */
    async translateContentObject(contentObj) {
        const translatedObj = {};

        try {
            // Translate title
            if (contentObj.title) {
                translatedObj.titleTamil = await this.translateText(contentObj.title);
            }

            // Translate subtitle
            if (contentObj.subtitle) {
                translatedObj.subtitleTamil = await this.translateText(contentObj.subtitle);
            }

            // Translate content (HTML or plain text)
            if (contentObj.content) {
                if (this.isHtmlContent(contentObj.content)) {
                    translatedObj.contentTamil = await this.translateHtmlContent(contentObj.content);
                } else {
                    translatedObj.contentTamil = await this.translateText(contentObj.content);
                }
            }

            // Translate button text
            if (contentObj.buttonText) {
                translatedObj.buttonTextTamil = await this.translateText(contentObj.buttonText);
            }

            // Translate description (for books, ebooks, projects)
            if (contentObj.description) {
                if (this.isHtmlContent(contentObj.description)) {
                    translatedObj.descriptionTamil = await this.translateHtmlContent(contentObj.description);
                } else {
                    translatedObj.descriptionTamil = await this.translateText(contentObj.description);
                }
            }

            // Translate author name (for books, ebooks)
            if (contentObj.author) {
                translatedObj.authorTamil = await this.translateText(contentObj.author);
            }

            return translatedObj;
        } catch (error) {
            console.error("Content object translation error:", error.message);
            return {};
        }
    }

    /**
     * Check if text contains Tamil characters
     * @param {string} text - Text to check
     * @returns {boolean} - True if contains Tamil characters
     */
    containsTamilCharacters(text) {
        // Tamil Unicode range: U+0B80–U+0BFF
        const tamilRegex = /[\u0B80-\u0BFF]/;
        return tamilRegex.test(text);
    }

    /**
     * Check if content contains HTML tags
     * @param {string} content - Content to check
     * @returns {boolean} - True if contains HTML
     */
    isHtmlContent(content) {
        const htmlRegex = /<[^>]*>/;
        return htmlRegex.test(content);
    }

    /**
     * Batch translate multiple content objects
     * @param {Array} contentArray - Array of content objects
     * @returns {Promise<Array>} - Array of objects with translated fields
     */
    async batchTranslate(contentArray) {
        if (!Array.isArray(contentArray)) {
            return [];
        }

        const translationPromises = contentArray.map(content => 
            this.translateContentObject(content)
        );

        try {
            return await Promise.all(translationPromises);
        } catch (error) {
            console.error("Batch translation error:", error.message);
            return contentArray.map(() => ({})); // Return empty objects on error
        }
    }
}

// Create singleton instance
const translationService = new TranslationService();

module.exports = translationService;
