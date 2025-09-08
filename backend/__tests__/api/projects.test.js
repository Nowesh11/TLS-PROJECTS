const request = require('supertest');
const app = require('../../app');
const Project = require('../../models/Project');
const mongoose = require('mongoose');
require('../setup');

describe('Projects API', () => {
    let testProject;

    beforeEach(async () => {
        // Create test project
        testProject = await Project.create({
            title: {
                en: 'Test Project',
                ta: 'சோதனை திட்டம்'
            },
            slug: 'test-project',
            bureau: 'education-intellectual',
            description: {
                en: 'A test project description',
                ta: 'ஒரு சோதனை திட்ட விளக்கம்'
            },
            director: {
                en: 'Test Director',
                ta: 'சோதனை இயக்குனர்'
            },
            director_name: 'Test Director',
            director_email: 'director@test.com',
            status: 'active',
            goals: {
                en: 'Test project goals',
                ta: 'சோதனை திட்ட இலக்குகள்'
            },
            progress: 50
        });
    });

    describe('GET /api/projects', () => {
        it('should return English content by default', async () => {
            const response = await request(app)
                .get('/api/projects')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toEqual({en: 'Test Project', ta: 'சோதனை திட்டம்'});
            expect(response.body.data[0].description).toEqual({en: 'A test project description', ta: 'ஒரு சோதனை திட்ட விளக்கம்'});
            expect(response.body.data[0].goals).toEqual({en: 'Test project goals', ta: 'சோதனை திட்ட இலக்குகள்'});
        });

        it('should return English content when lang=en', async () => {
            const response = await request(app)
                .get('/api/projects?lang=en')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Test Project');
            expect(response.body.data[0].description).toBe('A test project description');
            expect(response.body.data[0].goals).toBe('Test project goals');
        });

        it('should return Tamil content when lang=ta', async () => {
            const response = await request(app)
                .get('/api/projects?lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('சோதனை திட்டம்');
            expect(response.body.data[0].description).toBe('ஒரு சோதனை திட்ட விளக்கம்');
            expect(response.body.data[0].goals).toBe('சோதனை திட்ட இலக்குகள்');
        });

        it('should handle pagination', async () => {
            // Create more projects
            for (let i = 1; i <= 5; i++) {
                await Project.create({
                    title: {en: `Project ${i}`, ta: `திட்டம் ${i}`},
                    description: {en: `Description ${i}`, ta: `விளக்கம் ${i}`},
                    goals: {en: `Goals ${i}`, ta: `இலக்குகள் ${i}`},
                    director: {en: `Director ${i}`, ta: `இயக்குனர் ${i}`},
                    slug: `project-${i}`,
                    bureau: 'education-intellectual',
                    status: 'draft',
                    director_name: `Director ${i}`,
                    director_email: `director${i}@example.com`,
                    director_phone: `+91-987654321${i}`,
                    primary_image_url: `https://example.com/image${i}.jpg`,
                    images_count: 3,
                    progress: 25 + i * 10
                });
            }

            const response = await request(app)
                .get('/api/projects?page=1&limit=3&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
            expect(response.body.total).toBe(6);
            expect(response.body.count).toBe(3);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter by category', async () => {
            // Create project with different category
            await Project.create({
                title: {en: 'Health Project', ta: 'சுகாதார திட்டம்'},
                description: {en: 'Health project description', ta: 'சுகாதார திட்ட விளக்கம்'},
                goals: {en: 'Health goals', ta: 'சுகாதார இலக்குகள்'},
                director: {en: 'Health Director', ta: 'சுகாதார இயக்குனர்'},
                slug: 'health-project',
                bureau: 'media-public-relations',
                status: 'active',
                director_name: 'Health Director',
                director_email: 'health@example.com',
                director_phone: '+91-9876543210',
                primary_image_url: 'https://example.com/health.jpg',
                images_count: 2,
                progress: 50
            });

            const response = await request(app)
                .get('/api/projects?bureau=media-public-relations&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('சுகாதார திட்டம்');
            expect(response.body.data[0].bureau).toBe('media-public-relations');
        });

        it('should filter by status', async () => {
            // Create completed project
            await Project.create({
                title: {en: 'Completed Project', ta: 'முடிந்த திட்டம்'},
                description: {en: 'Completed project description', ta: 'முடிந்த திட்ட விளக்கம்'},
                goals: {en: 'Completed goals', ta: 'முடிந்த இலக்குகள்'},
                director: {en: 'Completed Director', ta: 'முடிந்த இயக்குனர்'},
                slug: 'completed-project',
                bureau: 'education-intellectual',
                status: 'archived',
                director_name: 'Completed Director',
                director_email: 'completed@example.com',
                director_phone: '+91-9876543210',
                primary_image_url: 'https://example.com/completed.jpg',
                images_count: 1,
                progress: 100
            });

            const response = await request(app)
                .get('/api/projects?status=archived&lang=ta')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('முடிந்த திட்டம்');
            expect(response.body.data[0].status).toBe('archived');
        });
    });

    describe('GET /api/projects/:id', () => {
        it('should return specific project in English', async () => {
            const response = await request(app)
                .get(`/api/projects/${testProject._id}?lang=en`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Project');
            expect(response.body.data.description).toBe('A test project description');
            expect(response.body.data.goals).toBe('Test project goals');
        });

        it('should return specific project in Tamil', async () => {
            const response = await request(app)
                .get(`/api/projects/${testProject._id}?lang=ta`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('சோதனை திட்டம்');
            expect(response.body.data.description).toBe('ஒரு சோதனை திட்ட விளக்கம்');
            expect(response.body.data.goals).toBe('சோதனை திட்ட இலக்குகள்');
        });

        it('should return 404 for non-existent project', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/projects/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
});