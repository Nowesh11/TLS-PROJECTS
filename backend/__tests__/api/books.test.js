const request = require('supertest');
const app = require('../../app');
const Book = require('../../models/Book');
const mongoose = require('mongoose');
require('../setup');

describe('Books API', () => {
    let testBook;

    beforeEach(async () => {
        // Create test book
        testBook = await Book.create({
            title: {
                en: 'Test Book',
                ta: 'சோதனை புத்தகம்'
            },
            author: {
                en: 'Test Author',
                ta: 'சோதனை ஆசிரியர்'
            },
            description: {
                en: 'A test book description',
                ta: 'ஒரு சோதனை புத்தக விளக்கம்'
            },
            category: 'literature',
            price: 299,
            inStock: true,
            status: 'active',
            createdBy: new mongoose.Types.ObjectId()
        });
    });

    describe('GET /api/books', () => {
        it('should return English content by default', async () => {
            const response = await request(app)
                .get('/api/books?lang=en')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Test Book');
            expect(response.body.data[0].author).toBe('Test Author');
            expect(response.body.data[0].description).toBe('A test book description');
        });

        it('should return English content when lang=en', async () => {
            const response = await request(app)
                .get('/api/books?lang=en')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Test Book');
            expect(response.body.data[0].author).toBe('Test Author');
            expect(response.body.data[0].description).toBe('A test book description');
        });

        it('should return Tamil content when lang=ta', async () => {
            const response = await request(app)
                .get('/api/books?lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('சோதனை புத்தகம்');
            expect(response.body.data[0].author).toBe('சோதனை ஆசிரியர்');
            expect(response.body.data[0].description).toBe('ஒரு சோதனை புத்தக விளக்கம்');
        });

        it('should handle pagination', async () => {
            // Create more books
            for (let i = 1; i <= 5; i++) {
                await Book.create({
                    title: {
                        en: `Book ${i}`,
                        ta: `புத்தகம் ${i}`
                    },
                    author: {
                        en: `Author ${i}`,
                        ta: `ஆசிரியர் ${i}`
                    },
                    description: {
                        en: `Description ${i}`,
                        ta: `விளக்கம் ${i}`
                    },
                    price: 299 + i,
                    category: 'fiction',
                    isbn: `123456789012${i}`,
                    pages: 200 + i,
                    publisher: 'Test Publisher',
                    publishedDate: new Date('2024-01-01'),
                    stockQuantity: 10,
                    status: 'active',
                    createdBy: new mongoose.Types.ObjectId()
                });
            }

            const response = await request(app)
                .get('/api/books?page=1&limit=3&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
            expect(response.body.total).toBe(6);
            expect(response.body.count).toBe(3);
        });

        it('should filter by category', async () => {
            // Create book with different category
            await Book.create({
                title: {
                    en: 'Non-Fiction Book',
                    ta: 'உண்மை புத்தகம்'
                },
                author: {
                    en: 'NF Author',
                    ta: 'உண்மை ஆசிரியர்'
                },
                description: {
                    en: 'Non-fiction description',
                    ta: 'உண்மை விளக்கம்'
                },
                price: 399,
                category: 'non-fiction',
                language: 'english',
                isbn: '9876543210123',
                pages: 300,
                publisher: 'Test Publisher',
                publishedDate: new Date('2024-01-01'),
                stockQuantity: 5,
                status: 'active',
                inStock: true,
                createdBy: new mongoose.Types.ObjectId()
            });

            const response = await request(app)
                .get('/api/books?category=non-fiction&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('உண்மை புத்தகம்');
            expect(response.body.data[0].category).toBe('non-fiction');
        });
    });

    describe('GET /api/books/:id', () => {
        it('should return specific book in English', async () => {
            const response = await request(app)
                .get(`/api/books/${testBook._id}?lang=en`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Book');
            expect(response.body.data.author).toBe('Test Author');
        });

        it('should return specific book in Tamil', async () => {
            const response = await request(app)
                .get(`/api/books/${testBook._id}?lang=ta`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('சோதனை புத்தகம்');
            expect(response.body.data.author).toBe('சோதனை ஆசிரியர்');
        });

        it('should return 404 for non-existent book', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/books/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
});