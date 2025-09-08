const request = require('supertest');
const app = require('../../app');
const WebsiteContentSection = require('../../models/WebsiteContentSection');
require('../setup');

describe('Website Content API', () => {
    let testContent;

    beforeEach(async () => {
        // Create test content
        testContent = await WebsiteContentSection.create({
            pageName: 'home',
            sectionId: 'hero',
            sectionTitle: 'Welcome to TLS',
            contentHtml: '<h1>Welcome to TLS</h1>',
            contentTamil: '<h1>TLS இல் வரவேற்கிறோம்</h1>',
            order: 1,
            isActive: true,
            isVisible: true
        });
    });

    describe('GET /api/website-content/sections/:page', () => {
        it('should return sections for a page', async () => {
            const res = await request(app)
                .get('/api/website-content/sections/home')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].pageName).toBe('home');
            expect(res.body.data[0].sectionId).toBe('hero');
            expect(res.body.data[0].sectionTitle).toBe('Welcome to TLS');
            expect(res.body.data[0].contentHtml).toBe('<h1>Welcome to TLS</h1>');
            expect(res.body.data[0].contentTamil).toBe('<h1>TLS இல் வரவேற்கிறோம்</h1>');
        });

        it('should return empty data for non-existent page', async () => {
            const res = await request(app)
                .get('/api/website-content/sections/nonexistent')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(0);
        });

        it('should return multiple sections for a page ordered correctly', async () => {
            // Add another section
            await WebsiteContentSection.create({
                pageName: 'home',
                sectionId: 'about',
                sectionTitle: 'About Us',
                contentHtml: '<h2>About Us</h2>',
                contentTamil: '<h2>எங்களைப் பற்றி</h2>',
                order: 2,
                isActive: true,
                isVisible: true
            });

            const res = await request(app)
                .get('/api/website-content/sections/home')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].order).toBe(1);
            expect(res.body.data[1].order).toBe(2);
        });

        it('should only return active and visible sections', async () => {
            // Add inactive section
            await WebsiteContentSection.create({
                pageName: 'home',
                sectionId: 'inactive',
                sectionTitle: 'Inactive Section',
                contentHtml: '<p>This should not appear</p>',
                order: 3,
                isActive: false,
                isVisible: true
            });

            // Add invisible section
            await WebsiteContentSection.create({
                pageName: 'home',
                sectionId: 'invisible',
                sectionTitle: 'Invisible Section',
                contentHtml: '<p>This should not appear</p>',
                order: 4,
                isActive: true,
                isVisible: false
            });

            const res = await request(app)
                .get('/api/website-content/sections/home')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1); // Only the original active and visible section
            expect(res.body.data[0].sectionId).toBe('hero');
        });
    });
});