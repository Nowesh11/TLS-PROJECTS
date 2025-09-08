const request = require('supertest');
const app = require('../../app');
const Ebook = require('../../models/Ebook');
const mongoose = require('mongoose');
require('../setup');

describe('Ebooks API', () => {
    let testEbook;

    beforeEach(async () => {
        // Create test ebook
        testEbook = await Ebook.create({
            title: {
                en: 'Test Ebook',
                ta: 'சோதனை மின்புத்தகம்'
            },
            author: {
                en: 'Test Author',
                ta: 'சோதனை ஆசிரியர்'
            },
            description: {
                en: 'A test ebook description',
                ta: 'ஒரு சோதனை மின்புத்தக விளக்கம்'
            },
            category: 'literature',
            fileFormat: 'PDF',
            fileUrl: '/uploads/ebooks/test-ebook.pdf',
            isFree: true,
            status: 'active',
            createdBy: new mongoose.Types.ObjectId()
         });
     });

    describe('GET /api/ebooks', () => {
        it('should return bilingual content by default', async () => {
            const response = await request(app)
                .get('/api/ebooks')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toEqual({
                en: 'Test Ebook',
                ta: 'சோதனை மின்புத்தகம்'
            });
            expect(response.body.data[0].author).toEqual({
                en: 'Test Author',
                ta: 'சோதனை ஆசிரியர்'
            });
            expect(response.body.data[0].description).toEqual({
                en: 'A test ebook description',
                ta: 'ஒரு சோதனை மின்புத்தக விளக்கம்'
            });
        });

        it('should return English content when lang=en', async () => {
            const response = await request(app)
                .get('/api/ebooks?lang=en')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Test Ebook');
            expect(response.body.data[0].author).toBe('Test Author');
            expect(response.body.data[0].description).toBe('A test ebook description');
        });

        it('should return Tamil content when lang=ta', async () => {
            const response = await request(app)
                .get('/api/ebooks?lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('சோதனை மின்புத்தகம்');
            expect(response.body.data[0].author).toBe('சோதனை ஆசிரியர்');
            expect(response.body.data[0].description).toBe('ஒரு சோதனை மின்புத்தக விளக்கம்');
        });

        it('should handle pagination', async () => {
            // Create more ebooks
            for (let i = 1; i <= 5; i++) {
                await Ebook.create({
                    title: {
                        en: `Ebook ${i}`,
                        ta: `மின்புத்தகம் ${i}`
                    },
                    author: {
                        en: `Author ${i}`,
                        ta: `ஆசிரியர் ${i}`
                    },
                    description: {
                        en: `Description ${i}`,
                        ta: `விளக்கம் ${i}`
                    },
                    price: 199 + i,
                    category: 'fiction',
                    language: 'english',
                    isbn: `123456789012${i}`,
                    pages: 150 + i,
                    publisher: 'Test Publisher',
                    publication_date: new Date('2024-01-01'),
                    cover_image: `/uploads/ebooks/test-cover-${i}.jpg`,
                    fileUrl: `/uploads/ebooks/test-ebook-${i}.pdf`,
                    file_size: 2048576 + i * 1024,
                    fileFormat: 'PDF',
                    status: 'active',
                    download_count: 0,
                    createdBy: new mongoose.Types.ObjectId()
                });
            }

            const response = await request(app)
                .get('/api/ebooks?page=1&limit=3&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
            expect(response.body.total).toBe(6);
            expect(response.body.count).toBe(3);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter by category', async () => {
            // Create ebook with different category
            await Ebook.create({
                title: {
                    en: 'Non-Fiction Ebook',
                    ta: 'உண்மை மின்புத்தகம்'
                },
                author: {
                    en: 'NF Author',
                    ta: 'உண்மை ஆசிரியர்'
                },
                description: {
                    en: 'Non-fiction ebook description',
                    ta: 'உண்மை மின்புத்தக விளக்கம்'
                },
                category: 'non-fiction',
                fileFormat: 'PDF',
                fileUrl: '/uploads/ebooks/nf-ebook.pdf',
                status: 'active',
                createdBy: new mongoose.Types.ObjectId()
            });

            const response = await request(app)
                .get('/api/ebooks?category=non-fiction&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('உண்மை மின்புத்தகம்');
            expect(response.body.data[0].category).toBe('non-fiction');
        });

        it('should filter by format', async () => {
            // Create ebook with different format
            await Ebook.create({
                title: {
                    en: 'EPUB Ebook',
                    ta: 'EPUB மின்புத்தகம்'
                },
                author: {
                    en: 'EPUB Author',
                    ta: 'EPUB ஆசிரியர்'
                },
                description: {
                    en: 'EPUB format ebook',
                    ta: 'EPUB வடிவ மின்புத்தகம்'
                },
                category: 'fiction',
                fileFormat: 'EPUB',
                fileUrl: '/uploads/ebooks/epub-ebook.epub',
                status: 'active',
                createdBy: new mongoose.Types.ObjectId()
            });

            const response = await request(app)
                .get('/api/ebooks?format=EPUB&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('EPUB மின்புத்தகம்');
            expect(response.body.data[0].fileFormat).toBe('EPUB');
        });
    });

    describe('GET /api/ebooks/:id', () => {
        it('should return specific ebook in English', async () => {
            const response = await request(app)
                .get(`/api/ebooks/${testEbook._id}?lang=en`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Ebook');
            expect(response.body.data.author).toBe('Test Author');
            expect(response.body.data.description).toBe('A test ebook description');
        });

        it('should return specific ebook in Tamil', async () => {
            const response = await request(app)
                .get(`/api/ebooks/${testEbook._id}?lang=ta`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('சோதனை மின்புத்தகம்');
            expect(response.body.data.author).toBe('சோதனை ஆசிரியர்');
            expect(response.body.data.description).toBe('ஒரு சோதனை மின்புத்தக விளக்கம்');
        });

        it('should return 404 for non-existent ebook', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/ebooks/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/ebooks with search', () => {
        it('should search ebooks by title in English', async () => {
            const response = await request(app)
                .get('/api/ebooks?search=Test&lang=en')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Test Ebook');
        });

        it('should search ebooks by title in Tamil', async () => {
            const response = await request(app)
                .get('/api/ebooks?search=சோதனை&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('சோதனை மின்புத்தகம்');
        });
    });
});