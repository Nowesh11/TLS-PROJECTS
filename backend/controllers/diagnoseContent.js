// Place this in /controllers/diagnoseContent.js

const WebsiteContentSection = require("../models/WebsiteContentSection");

exports.diagnoseContent = async (req, res) => {
  try {
    const rawPage = req.params.page;
    const page = rawPage.toLowerCase();

    console.log("🔍 Received request for page:", rawPage, "-> normalized to:", page);

    // Check DB for matching records
    const results = await WebsiteContentSection.find({ pageName: page });
    console.log(`📊 Found ${results.length} sections for "${page}"`);

    // Check visibility status
    const visibleSections = await WebsiteContentSection.find({ pageName: page, isVisible: true });
    const hiddenSections = await WebsiteContentSection.find({ pageName: page, isVisible: { $ne: true } });
    
    console.log(`👁️ Visible sections: ${visibleSections.length}, Hidden sections: ${hiddenSections.length}`);

    // Extra DB stats
    const allPages = await WebsiteContentSection.aggregate([
      { $group: { _id: "$pageName", count: { $sum: 1 } } }
    ]);
    console.log("📋 DB page counts:", allPages);

    res.json({
      requestPage: rawPage,
      normalizedPage: page,
      sectionCount: results.length,
      visibleSections: visibleSections.length,
      hiddenSections: hiddenSections.length,
      availablePages: allPages,
      sampleSections: results.slice(0, 3), // preview first 3
      visibilityBreakdown: results.map(s => ({ 
        sectionId: s.sectionId, 
        isVisible: s.isVisible,
        sectionTitle: s.sectionTitle 
      }))
    });

  } catch (err) {
    console.error("❌ Diagnosis failed:", err);
    res.status(500).json({ error: err.message });
  }
};