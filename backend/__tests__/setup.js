const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup test database
beforeAll(async () => {
    try {
        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Test database connected successfully');
    } catch (error) {
        console.error('Failed to setup test database:', error);
        throw error;
    }
}, 60000);

// Clean up after each test
afterEach(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                const collection = collections[key];
                await collection.deleteMany({});
            }
        }
    } catch (error) {
        console.error('Failed to clean up test data:', error);
    }
});

// Cleanup after all tests
afterAll(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('Test database cleanup completed');
    } catch (error) {
        console.error('Failed to cleanup test database:', error);
    }
}, 60000);

// Global test timeout
jest.setTimeout(60000);

// Suppress console logs during tests unless there's an error
if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
}