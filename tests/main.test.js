const request = require("supertest");
const { v4: uuidv4 } = require("uuid");

const mongo = require("../config/mongo");
const app = require("../app");

const user = {
    username: "test",
    password: "SupD3Vinci@2022-2023",
    email: "test@gmail.com"
};

const maliciousUser = {
    username: "Anonymous",
    password: "FucKS0c13tY@",
    email: "fsociety@protonmail.com"
}

const article = {
    title: "Les boxers de bordeaux sont les meilleurs au hockey",
    content: "Oui ce blog est tout a fait vrai !",
}

const comment = {
    content: "Samu Perhonen est le meilleur joueur de hockey au monde",
}

/* -------------------------------------------------------------------------- */
/*                         Testing failing resgisters                         */
/* -------------------------------------------------------------------------- */

describe("Testing failing resgisters", () => {
    beforeAll(() => {
        mongo.connect();
    });

    afterAll(() => {
        mongo.disconnect();
    });

    test("🧪 Create a user with invalid body", async () => {
        const response = await request(app).post("/users/register").send({
            username: user.username,
        });
        expect(response.statusCode).toBe(400);
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
});

/* -------------------------------------------------------------------------- */
/*                       Testing the main API scenarios                       */
/* -------------------------------------------------------------------------- */

describe("Testing the main API scenarios", () => {

    let articleId = ""
    let commentId = ""
    let userId = ""
    let userToken = ""

    let maliciousUserId = ""
    let maliciousUserToken = ""

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

    test("🧪 Create a user", async () => {
        const response = await request(app).post("/users/register").send(user);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.user.username).toBe(user.username);
        expect(response.body.data.user.email).toBe(user.email);
        userId = response.body.data.user.id;
    });

    test("🧪 Create a malicious user", async () => {
        const response = await request(app).post("/users/register").send(maliciousUser);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.user.username).toBe(maliciousUser.username);
        expect(response.body.data.user.email).toBe(maliciousUser.email);
        maliciousUserId = response.body.data.user.id;
    });

    test("🧪 Create a user with same email", async () => {
        const response = await request(app).post("/users/register").send(user);
        expect(response.statusCode).toBe(409);
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

    test("🧪 Login with invalid body", async () => {
        const response = await request(app).post("/users/login").send({
            email: user.email,
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Login with malicious user", async () => {
        const response = await request(app).post("/users/login").send({
            email: maliciousUser.email,
            password: maliciousUser.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.username).toBe(maliciousUser.username);
        expect(response.body.data.user.email).toBe(maliciousUser.email);
        maliciousUserToken = response.body.data.token;
    });

    test("🧪 Login with wrong password", async () => {
        const response = await request(app).post("/users/login").send({
            email: user.email,
            password: "test"
        });
        expect(response.statusCode).toBe(400);
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

    test("🧪 Blog should have 0 comments", async () => {
        const response = await request(app).get(`/blogs/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.comments.length).toBe(0);
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

    test("🧪 Should have 0 blog written by malicious user", async () => {
        const response = await request(app).get("/blogs?author=" + maliciousUserId).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
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

    test("🧪 Blog should have 1 comment", async () => {
        const response = await request(app).get(`/blogs/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.comments.length).toBe(1);
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

    test("🧪 Create random article to test pagination", async () => {
        for (let i = 0; i < 10; i++) {
            let title = uuidv4().replace(/-/g, "");
            let content = uuidv4().replace(/-/g, "");
            const response = await request(app).post("/blogs").set("Authorization", userToken).send({
                title,
                content
            });
            expect(response.statusCode).toBe(201);
        }

        const responseAllBlogs = await request(app).get("/blogs");
        expect(responseAllBlogs.statusCode).toBe(200);
        expect(responseAllBlogs.body.data.articles.length).toBe(10);

        const responseAllBlogsPage2 = await request(app).get("/blogs?page=2");
        expect(responseAllBlogsPage2.statusCode).toBe(200);
        expect(responseAllBlogsPage2.body.data.articles.length).toBe(1);

        const responseAllBlogsWithPageSizeAndPagination = await request(app).get("/blogs?page=3&pageSize=2");
        expect(responseAllBlogsWithPageSizeAndPagination.statusCode).toBe(200);
        expect(responseAllBlogsWithPageSizeAndPagination.body.data.articles.length).toBe(2);
    });

    test("🧪 Edit a blog", async () => {
        const response = await request(app).put(`/blogs/${articleId}`).set("Authorization", userToken).send({
            title: article.title + " foo",
        });
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Edit a blog with malicious user", async () => {
        const response = await request(app).put(`/blogs/${articleId}`).set("Authorization", maliciousUserToken).send({
            title: "We are Legion. We do not forgive. We do not forget. Expect us.",
        });
        expect(response.statusCode).toBe(403);
    });
    
    test("🧪 Edit not existing blog", async () => {
        const response = await request(app).put(`/blogs/unexistedId`).set("Authorization", userToken).send({
            title: article.title + " foo",
        });
        expect(response.statusCode).toBe(404);
    });
    
    test("🧪 Main article updated date change after editing", async () => {
        const response = await request(app).get(`/blogs/${articleId}`);
        expect(response.statusCode).toBe(200);
        let beforeEditDate = response.body.data.article.lastUpdated;
        const responseEdit = await request(app).put(`/blogs/${articleId}`).set("Authorization", userToken).send({
            title: article.title + " edited",
            content: article.content
        });
        expect(responseEdit.statusCode).toBe(200);
        const responseAfterEdit = await request(app).get(`/blogs/${articleId}`);
        expect(responseAfterEdit.statusCode).toBe(200);
        let afterEditDate = responseAfterEdit.body.data.article.lastUpdated;
        expect(beforeEditDate).not.toBe(afterEditDate);
        expect(responseAfterEdit.body.data.article.title).toBe(article.title + " edited");
    });
       
    test("🧪 Main article updated date don't change at each getter", async () => {
        const response = await request(app).get(`/blogs/${articleId}`);
        expect(response.statusCode).toBe(200);
        let beforeEditDate = response.body.data.article.lastUpdated;

        // wait 1 sec
        await new Promise(resolve => setTimeout(resolve, 1000));

        const responseAfterOneSec = await request(app).get(`/blogs/${articleId}`);
        expect(responseAfterOneSec.statusCode).toBe(200);
        let afterEditDate = responseAfterOneSec.body.data.article.lastUpdated;
        expect(beforeEditDate).toBe(afterEditDate);
    });

    test("🧪 Delete a with malicious user", async () => {
        const response = await request(app).delete(`/blogs/${articleId}`).set("Authorization", maliciousUserToken);
        expect(response.statusCode).toBe(403);
    });

    test("🧪 Delete a comment", async () => {
        const response = await request(app).delete(`/blogs/comments/${commentId}`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete unexisting comment", async () => {
        const response = await request(app).delete(`/blogs/comments/${commentId}`).set("Authorization", maliciousUserToken);
        expect(response.statusCode).toBe(404);
    });

    test("🧪 Delete a blog", async () => {
        const response = await request(app).delete(`/blogs/${articleId}`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete main user", async () => {
        const response = await request(app).delete(`/users/${userId}`).set("Authorization", userToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete malicious user", async () => {
        const response = await request(app).delete(`/users/${maliciousUserId}`).set("Authorization", maliciousUserToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Should have 0 blog", async () => {
        const response = await request(app).get("/blogs");
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });

    test("🧪 Easter egg", async () => {
        const response = await request(app).get("/easter-egg");
        expect(response.statusCode).toBe(418);
    });

    test("🧪 Call with 178.20.55.18 should be blocked", async () => {
        const response = await request(app).get("/").set("X-Forwarded-For", "178.20.55.18");
        expect(response.statusCode).toBe(403);
    });
});

/* -------------------------------------------------------------------------- */
/*                            Testing API features                            */
/* -------------------------------------------------------------------------- */

describe("Testing API features", () => {
    test("🧪 Easter egg", async () => {
        const response = await request(app).get("/easter-egg");
        expect(response.statusCode).toBe(418);
    });

    let blacklistedIp = "178.20.55.18";
    test("🧪 Call with blacklisted ip", async () => {
        const response = await request(app).get("/").set("X-Forwarded-For", blacklistedIp);
        expect(response.statusCode).toBe(403);
    });
});