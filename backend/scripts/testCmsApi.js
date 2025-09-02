// Script to test the CMS API endpoints
require("dotenv").config();
const axios = require("axios");

const BASE_URL = "http://localhost:8080";

async function testCmsApi() {
  try {
    console.log("[TEST] Testing CMS API endpoints...");
    
    // Test pages to check
    const pages = ["home", "about", "books", "ebooks", "contact"];
    
    for (const page of pages) {
      console.log(`\n[TEST] Testing page: ${page}`);
      
      try {
        // Test the sections endpoint
        const response = await axios.get(`${BASE_URL}/api/website-content/sections/${page}`);
        
        if (response.data.success) {
          console.log(`[TEST] ✅ ${page}: Found ${response.data.count} sections`);
          
          // Show first section details if available
          if (response.data.data.length > 0) {
            const firstSection = response.data.data[0];
            console.log(`[TEST]    First section: "${firstSection.sectionTitle}" (${firstSection.contentHtml.length} chars)`);
          }
        } else {
          console.log(`[TEST] ❌ ${page}: API returned success=false`);
        }
      } catch (error) {
        console.log(`[TEST] ❌ ${page}: Error - ${error.message}`);
      }
    }
    
    console.log("\n[TEST] CMS API testing completed");
  } catch (error) {
    console.error("[TEST] Error during API testing:", error.message);
  }
}

// Run the test
testCmsApi();