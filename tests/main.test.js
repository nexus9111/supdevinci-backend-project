const request = require("supertest");
const mongo = require("../config/mongo");
const app = require("../app");


describe("Test the root path", () => {
    beforeAll(() => {
        mongo.connect();
    });

    test("🧪 Server should be", async () => {
        const response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
    });

    test("🧪 No blogs should exists at init", async () => {
        const response = await request(app).get("/blogs");
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });

    test("🧪 Create a blog with no logs", async () => {
        const response = await request(app).post("/blogs");
        expect(response.statusCode).toBe(401);
    });
});