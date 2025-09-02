/**
 * Global teardown for Playwright tests
 * Handles cleanup after all tests complete
 */
async function globalTeardown() {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up any test data or temporary files if needed
    // Note: We don't stop the servers as they might be used for development
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error.message);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;