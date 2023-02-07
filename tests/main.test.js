const request = require("supertest");
const mongo = require("../config/mongo");
const app = require("../app");

const user = {
    username: "test",
    password: "SupD3Vinci@2022-2023",
    email: "test@gmail.com"
};

const article = {
    title: "Les boxers de bordeaux sont les meilleurs au hockey",
    content: "Oui ce blog est tout a fait vrai !",
}

const comment = {
    content: "Samu Perhonen est le meilleur joueur de hockey au monde",
}

describe("Testing the main API", () => {

    let articleId = ""
    let commentId = ""
    let userId = ""
    let userToken = ""

    beforeAll(() => {
        mongo.connect();
    });

    afterAll(() => {
        mongo.disconnect();
    })

    test("🧪 Server should be alive", async () => {
        const response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
    });

    test("🧪 No blogs should exists at init", async () => {
        const response = await request(app).get("/blogs");
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });

    test("🧪 Create a blog with no credentials", async () => {
        const response = await request(app).post("/blogs");
        expect(response.statusCode).toBe(401);
    });

    test("🧪 Create a user with invalid email", async () => {
        const response = await request(app).post("/users/register").send({
            username: user.username,
            password: user.password,
            email: "test"
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Create a user with invalid password", async () => {
        const response = await request(app).post("/users/register").send({
            username: user.username,
            password: "test",
            email: user.email
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Create a user", async () => {
        const response = await request(app).post("/users/register").send(user);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.user.username).toBe(user.username);
        expect(response.body.data.user.email).toBe(user.email);
        userId = response.body.data.user.id;
    });

    test("🧪 Create a user with same email", async () => {
        const response = await request(app).post("/users/register").send(user);
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Login", async () => {
        const response = await request(app).post("/users/login").send({
            email: user.email,
            password: user.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.username).toBe(user.username);
        expect(response.body.data.user.email).toBe(user.email);
        userToken = response.body.data.token;
    });

    test("🧪 Login with wrong password", async () => {
        const response = await request(app).post("/users/login").send({
            email: user.email,
            password: "test"
        });
        expect(response.statusCode).toBe(403);
    });

    test("🧪 Login with wrong email", async () => {
        const response = await request(app).post("/users/login").send({
            email: "test",
            password: user.password
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Get user", async () => {
        const response = await request(app).get(`/users/profile`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.username).toBe(user.username);
        expect(response.body.data.user.email).toBe(user.email);
        expect(response.body.data.user.id).toBe(userId);
    });

    test("🧪 Create a blog", async () => {
        const response = await request(app).post("/blogs").set("Authorization", userToken).send({
            title: article.title,
            content: article.content
        });
        expect(response.statusCode).toBe(201);
        articleId = response.body.data.article.id;
    });

    test("🧪 Create a blog with no title", async () => {
        const response = await request(app).post("/blogs").set("Authorization", userToken).send({
            content: article.content
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Create a blog with no content", async () => {
        const response = await request(app).post("/blogs").set("Authorization", userToken).send({
            title: article.title
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Create a blog with invalid title", async () => {
        const response = await request(app).post("/blogs").set("Authorization", userToken).send({
            title: "test",
            content: article.content
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Should have 1 blog", async () => {
        const response = await request(app).get("/blogs");
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(1);
    });

    test("🧪 Get a blog", async () => {
        const response = await request(app).get(`/blogs/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.title).toBe(article.title);
        expect(response.body.data.article.content).toBe(article.content);
    });

    test("🧪 Comment a blog", async () => {
        const response = await request(app).post(`/blogs/comments/${articleId}`).set("Authorization", userToken).send({
            comment: comment.content
        });
        commentId = response.body.data.comment.id;
        expect(response.statusCode).toBe(201);
    });

    test("🧪 Comment with no content", async () => {
        const response = await request(app).post(`/blogs/comments/${articleId}`).set("Authorization", userToken).send({
            comment: ""
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Blog should have 1 comment", async () => {
        const response = await request(app).get(`/blogs/comments/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.comments.length).toBe(1);
    });


    test("🧪 Delete a comment", async () => {
        const response = await request(app).delete(`/blogs/comments/${commentId}`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete a blog", async () => {
        const response = await request(app).delete(`/blogs/${articleId}`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete a user", async () => {
        const response = await request(app).delete(`/users/${userId}`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
    });
});