const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("Server Tests", () => {
  // Setup and teardown
  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";
  });

  afterAll(async () => {
    // Close database connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // Basic server tests
  test("GET /api/health should return health status", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect(200);
    
    expect(response.body).toHaveProperty("status", "OK");
    expect(response.body).toHaveProperty("timestamp");
  });

  // Test public endpoints that don't require authentication
  test("GET /api/books should respond (may require auth)", async () => {
    const response = await request(app)
      .get("/api/books");
    
    // Accept either 200 (success) or 401 (unauthorized) as valid responses
    expect([200, 401]).toContain(response.status);
  });

  test("GET /api/ebooks should respond (may require auth)", async () => {
    const response = await request(app)
      .get("/api/ebooks");
    
    expect([200, 401]).toContain(response.status);
  });

  test("GET /api/projects should respond (may require auth)", async () => {
    const response = await request(app)
      .get("/api/projects");
    
    expect([200, 401]).toContain(response.status);
  });

  test("GET /api/activities should respond (may require auth)", async () => {
    const response = await request(app)
      .get("/api/activities");
    
    expect([200, 401]).toContain(response.status);
  });

  test("GET /api/initiatives should respond (may require auth)", async () => {
    const response = await request(app)
      .get("/api/initiatives");
    
    expect([200, 401]).toContain(response.status);
  });

  test("GET /api/announcements should respond (may require auth)", async () => {
    const response = await request(app)
      .get("/api/announcements");
    
    expect([200, 401]).toContain(response.status);
  });

  // Test that server handles invalid routes properly
  test("GET /api/nonexistent should return 404", async () => {
    const response = await request(app)
      .get("/api/nonexistent")
      .expect(404);
  });
});