const { MongoClient } = require("mongodb");

async function migrateDatabase() {
  const client = new MongoClient("mongodb://localhost:27017");
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const sourceDb = client.db("tamilsociety");
    const targetDb = client.db("tamil-language-society");
    
    // Get all collections from source database
    const sourceCollections = await sourceDb.listCollections().toArray();
    console.log("Source collections:", sourceCollections.map(c => c.name));
    
    // Collections to exclude from migration (keep existing in target)
    const excludeCollections = ["websitecontents"];
    
    // Collections to migrate
    const collectionsToMigrate = sourceCollections
      .map(c => c.name)
      .filter(name => !excludeCollections.includes(name));
    
    console.log("Collections to migrate:", collectionsToMigrate);
    
    for (const collectionName of collectionsToMigrate) {
      console.log(`\nMigrating collection: ${collectionName}`);
      
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Get count of documents in source
      const sourceCount = await sourceCollection.countDocuments();
      console.log(`Source ${collectionName} count: ${sourceCount}`);
      
      if (sourceCount === 0) {
        console.log(`Skipping empty collection: ${collectionName}`);
        continue;
      }
      
      // Clear target collection first
      await targetCollection.deleteMany({});
      console.log(`Cleared target ${collectionName} collection`);
      
      // Copy all documents
      const documents = await sourceCollection.find({}).toArray();
      if (documents.length > 0) {
        await targetCollection.insertMany(documents);
        console.log(`Migrated ${documents.length} documents to ${collectionName}`);
      }
      
      // Verify migration
      const targetCount = await targetCollection.countDocuments();
      console.log(`Target ${collectionName} count after migration: ${targetCount}`);
      
      if (sourceCount !== targetCount) {
        console.error(`❌ Migration failed for ${collectionName}: source=${sourceCount}, target=${targetCount}`);
      } else {
        console.log(`✅ Successfully migrated ${collectionName}`);
      }
    }
    
    console.log("\n=== Migration Summary ===");
    
    // Final verification
    for (const collectionName of collectionsToMigrate) {
      const sourceCount = await sourceDb.collection(collectionName).countDocuments();
      const targetCount = await targetDb.collection(collectionName).countDocuments();
      console.log(`${collectionName}: ${sourceCount} -> ${targetCount} ${sourceCount === targetCount ? "✅" : "❌"}`);
    }
    
    // Check websitecontents is preserved
    const websiteContentsCount = await targetDb.collection("websitecontents").countDocuments();
    console.log(`websitecontents (preserved): ${websiteContentsCount} documents`);
    
    console.log("\n🎉 Database migration completed!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
migrateDatabase().catch(console.error);