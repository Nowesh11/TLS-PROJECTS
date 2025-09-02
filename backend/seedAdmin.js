const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Book = require('./models/Book');
const Ebook = require('./models/Ebook');
const Project = require('./models/Project');
const Activity = require('./models/Activity');
const Team = require('./models/Team');
const Chat = require('./models/Chat');

/**
 * Auto-Seeding Script for Tamil Literary Society Website
 * Ensures admin account and test data exist before running Playwright tests
 * Fixes authentication issues that cause 580 tests to be skipped
 */

class DatabaseSeeder {
    constructor() {
        this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil_literary_society';
        this.adminCredentials = {
            email: 'admin@tamilsociety.com',
            password: 'Admin123!',
            role: 'admin',
            full_name: 'Tamil Society Admin',
            name: 'Tamil Society Admin',
            isActive: true,
            isVerified: true
        };
    }

    async connect() {
        try {
            await mongoose.connect(this.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connected to MongoDB successfully');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            return false;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error.message);
        }
    }

    async clearTestData() {
        try {
            // Clear existing test data to ensure clean state
            await User.deleteMany({ email: { $regex: /test|admin@tamilsociety/ } });
            await Book.deleteMany({ title: { $regex: /test/i } });
            await Ebook.deleteMany({ title: { $regex: /test/i } });
            await Project.deleteMany({ title: { $regex: /test/i } });
            
            console.log('🧹 Cleared existing test data');
        } catch (error) {
            console.error('⚠️ Error clearing test data:', error.message);
        }
    }

    async createAdminUser() {
        try {
            // Check if admin already exists and clear any lockouts
            let existingAdmin = await User.findOne({ email: this.adminCredentials.email });
            
            if (existingAdmin) {
                // Clear any login attempts and lockouts using the model method
                await existingAdmin.clearLoginAttempts();
                console.log('✅ Admin user already exists - cleared lockouts');
                return existingAdmin;
            }

            // Hash password with bcrypt
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(this.adminCredentials.password, saltRounds);

            // Create admin user with cleared login attempts
            const adminUser = new User({
                ...this.adminCredentials,
                password: hashedPassword,
                loginAttempts: {
                    count: 0,
                    lastAttempt: null,
                    lockedUntil: null
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully');
            
            // Verify password works
            const passwordMatch = await bcrypt.compare(this.adminCredentials.password, hashedPassword);
            if (passwordMatch) {
                console.log('✅ Admin password verification successful');
            } else {
                throw new Error('Password verification failed');
            }

            return adminUser;
        } catch (error) {
            console.error('❌ Error creating admin user:', error.message);
            throw error;
        }
    }

    async seedTestBooks(adminUserId) {
        try {
            const testBooks = [
                {
                    title: 'Test Tamil Literature Book 1',
                    author: 'Test Author 1',
                    description: 'Test book for automated testing',
                    price: 299,
                    category: 'literature',
                    bookLanguage: 'Tamil',
                    stockQuantity: 50,
                    createdBy: adminUserId,
                    createdAt: new Date()
                },
                {
                    title: 'Test Tamil Poetry Collection',
                    author: 'Test Poet',
                    description: 'Test poetry collection for testing',
                    price: 199,
                    category: 'poetry',
                    bookLanguage: 'Tamil',
                    stockQuantity: 30,
                    createdBy: adminUserId,
                    createdAt: new Date()
                }
            ];

            await Book.insertMany(testBooks);
            console.log('✅ Test books seeded successfully');
        } catch (error) {
            console.error('⚠️ Error seeding test books:', error.message);
        }
    }

    async seedTestEbooks(adminUserId) {
        try {
            const testEbooks = [
                {
                    title: 'Test Digital Tamil Book',
                    author: 'Test Digital Author',
                    description: 'Test ebook for automated testing',
                    category: 'literature',
                    bookLanguage: 'Tamil',
                    fileUrl: '/test/sample-ebook.pdf',
                    fileFormat: 'PDF',
                    downloadCount: 0,
                    createdBy: adminUserId,
                    createdAt: new Date()
                }
            ];

            await Ebook.insertMany(testEbooks);
            console.log('✅ Test ebooks seeded successfully');
        } catch (error) {
            console.error('⚠️ Error seeding test ebooks:', error.message);
        }
    }

    async seedTestProjects(adminUserId) {
        try {
            const testProjects = [
                {
                    title: 'Test Tamil Cultural Project',
                    description: 'Test project for automated testing',
                    category: 'arts-culture',
                    status: 'active',
                    startDate: new Date(),
                    createdBy: adminUserId,
                    projectManager: adminUserId,
                    createdAt: new Date()
                }
            ];

            await Project.insertMany(testProjects);
            console.log('✅ Test projects seeded successfully');
        } catch (error) {
            console.error('⚠️ Error seeding test projects:', error.message);
        }
    }

    async seedTestUsers() {
        try {
            const hashedPassword = await bcrypt.hash('testuser123', 12);
            
            const testUsers = [
                {
                    name: 'Test User 1',
                    email: 'testuser1@example.com',
                    password: hashedPassword,
                    role: 'user',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date()
                },
                {
                    name: 'Test User 2',
                    email: 'testuser2@example.com',
                    password: hashedPassword,
                    role: 'user',
                    isActive: true,
                    isVerified: true,
                    createdAt: new Date()
                }
            ];

            await User.insertMany(testUsers);
            console.log('✅ Test users seeded successfully');
        } catch (error) {
            console.error('⚠️ Error seeding test users:', error.message);
        }
    }

    async validateSeeding() {
        try {
            // Validate admin user exists and can authenticate
            const admin = await User.findOne({ email: this.adminCredentials.email });
            if (!admin) {
                throw new Error('Admin user not found after seeding');
            }

            const passwordValid = await bcrypt.compare(this.adminCredentials.password, admin.password);
            if (!passwordValid) {
                throw new Error('Admin password validation failed');
            }

            // Count seeded data
            const bookCount = await Book.countDocuments({ title: { $regex: /test/i } });
            const ebookCount = await Ebook.countDocuments({ title: { $regex: /test/i } });
            const projectCount = await Project.countDocuments({ title: { $regex: /test/i } });
            const userCount = await User.countDocuments({ email: { $regex: /test/ } });

            console.log('\n📊 Seeding Validation Results:');
            console.log(`✅ Admin user: ${admin.email} (Role: ${admin.role})`);
            console.log(`✅ Test books: ${bookCount}`);
            console.log(`✅ Test ebooks: ${ebookCount}`);
            console.log(`✅ Test projects: ${projectCount}`);
            console.log(`✅ Test users: ${userCount}`);
            console.log('\n🎯 Database ready for Playwright testing!');

            return true;
        } catch (error) {
            console.error('❌ Seeding validation failed:', error.message);
            return false;
        }
    }

    async runFullSeeding() {
        console.log('🚀 Starting Tamil Literary Society Database Seeding...');
        console.log('📝 Purpose: Fix authentication issues causing 580 skipped tests\n');

        try {
            // Connect to database
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Failed to connect to database');
            }

            // Clear existing test data
            await this.clearTestData();

            // Seed all required data
            const adminUser = await this.createAdminUser();
            await this.seedTestBooks(adminUser._id);
            await this.seedTestEbooks(adminUser._id);
            await this.seedTestProjects(adminUser._id);
            await this.seedTestUsers();

            // Validate seeding
            const validationPassed = await this.validateSeeding();
            
            if (validationPassed) {
                console.log('\n🎉 Database seeding completed successfully!');
                console.log('🔧 Authentication issue fixed - tests should now run');
                return true;
            } else {
                throw new Error('Seeding validation failed');
            }

        } catch (error) {
            console.error('\n💥 Seeding failed:', error.message);
            return false;
        } finally {
            await this.disconnect();
        }
    }
}

// Export for use in other scripts
module.exports = DatabaseSeeder;

// Run seeding if called directly
if (require.main === module) {
    const seeder = new DatabaseSeeder();
    seeder.runFullSeeding()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

// Usage Instructions:
// 1. Run manually: node seedAdmin.js
// 2. Run before tests: Add to package.json scripts
// 3. Auto-run in CI/CD: Include in test pipeline
// 4. Playwright integration: Call in global-setup.js