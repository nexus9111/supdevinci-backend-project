const request = require("supertest");
const { v4: uuidv4 } = require("uuid");

const mongo = require("../config/mongo");
const app = require("../app");

const ACCOUNT_REGISTER_ENDPOINT = "/auth/register";
const ACCOUNT_LOGIN_ENDPOINT = "/auth/login";
const ACCOUNT_ENDPOINT = "/auth";

const PROFILE_ENDPOINT = "/profiles";

const BLOG_ENDPOINT = "/blogs";

const EASTER_EGG = "/easter-egg";

const account = {
    password: "SupD3Vinci@2022-2023",
    email: "test@gmail.com",
};

const accountPerson = {
    firstName: "samu",
    lastName: "perhonen",
    expectedFirstName: "Samu",
    expectedLastName: "PERHONEN",
    kind: "Person",
};

const accountCompany = {
    name: "supdevinci",
    expectedName: "Supdevinci",
    kind: "Company",
};

const maliciousAccount = {
    username: "Anonymous",
    password: "FucKS0c13tY@",
    email: "fsociety@protonmail.com",
};

const maliciousAccountPerson = {
    firstName: "Elliot",
    lastName: "Alderson",
    expectedFirstName: "Elliot",
    expectedLastName: "ALDERSON",
    kind: "Person",
};

const article = {
    title: "Les boxers de bordeaux sont les meilleurs au hockey",
    content: "Oui ce blog est tout a fait vrai !",
};

const comment = {
    comment: "Samu Perhonen est le meilleur joueur de hockey au monde",
};

/* -------------------------------------------------------------------------- */
/*                         Testing failing resgisters                         */
/* -------------------------------------------------------------------------- */
describe("Testing API without using database", () => {
    beforeAll(async () => {
        await mongo.connect();
    });

    afterAll(() => {
        mongo.disconnect();
    });

    test("🧪 Account creation with invalid body - should fail ", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send({
            username: "foo",
            kind: "bar"
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Account creation with invalid email - should fail", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send({
            password: account.password,
            email: "test",
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Account creation with invalid password  - should fail", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send({
            password: "test",
            email: account.email,
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Article creation without credentials - should fail", async () => {
        const response = await request(app).post(BLOG_ENDPOINT);
        expect(response.statusCode).toBe(401);
    });

    test("🧪 Login with invalid body - should fail", async () => {
        const response = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send({
            email: account.email,
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Person profile creation without credentials - should fail", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .send(accountPerson);
        expect(response.statusCode).toBe(401);
    });
});

/* -------------------------------------------------------------------------- */
/*                       Testing the main API scenarios                       */
/* -------------------------------------------------------------------------- */
describe("Testing the main API scenarios", () => {
    let accountToken;
    let articleId;
    let commentId;
    let accountPersonId;

    beforeAll(async () => {
        await mongo.connect();
    });

    afterAll(() => {
        mongo.disconnect();
    });

    test("🧪 Account creation", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send(account);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.account.email).toBe(account.email);
        accountId = response.body.data.account.id;
    });

    test("🧪 Account login", async () => {
        const response = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send({
            email: account.email,
            password: account.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.account.email).toBe(account.email);
        accountToken = response.body.data.token;
    });

    test("🧪 Person profile creation", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountPerson);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.person.firstName).toBe(accountPerson.expectedFirstName);
        expect(response.body.data.person.lastName).toBe(accountPerson.expectedLastName);
        expect(response.body.data.person.kind).toBe("Person");
        accountPersonId = response.body.data.person.id;
    });

    test("🧪 Article creation on person profile", async () => {
        const articleWithProfileId = Object.assign({}, article, { profileId: accountPersonId });
        const response = await request(app).post(BLOG_ENDPOINT)
            .set("Authorization", accountToken)
            .send(articleWithProfileId);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.article.title).toBe(article.title);
        expect(response.body.data.article.content).toBe(article.content);
        expect(response.body.data.article.author).toBe(accountPersonId);
        articleId = response.body.data.article.id;
    });

    test("🧪 Article title edition on person profile", async () => {
        const response = await request(app).put(`${BLOG_ENDPOINT}/${articleId}`)
            .set("Authorization", accountToken)
            .send({ title: "New title", profileId: accountPersonId });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.title).toBe("New title");
        expect(response.body.data.article.content).toBe(article.content);
        expect(response.body.data.article.author).toBe(accountPersonId);
    });

    test("🧪 Article content edition on person profile", async () => {
        const response = await request(app).put(`${BLOG_ENDPOINT}/${articleId}`)
            .set("Authorization", accountToken)
            .send({ content: "New content", profileId: accountPersonId });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.title).toBe("New title");
        expect(response.body.data.article.content).toBe("New content");
        expect(response.body.data.article.author).toBe(accountPersonId);
    });

    test("🧪 Comment creation on person profile article", async () => {
        const commentWithProfileId = Object.assign({}, comment, { profileId: accountPersonId });
        const response = await request(app).post(`${BLOG_ENDPOINT}/${articleId}/comments`)
            .set("Authorization", accountToken)
            .send(commentWithProfileId);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.comment.content).toBe(comment.content);
        expect(response.body.data.comment.author).toBe(accountPersonId);
        commentId = response.body.data.comment.id;
    });

    test("🧪 Comment deletion on person profile article", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/comments/${commentId}?profileId=${accountPersonId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Article deletion on person profile", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/${articleId}?profileId=${accountPersonId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Account deletion", async () => {
        const response = await request(app).delete(`${ACCOUNT_ENDPOINT}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 No article should left after deletion", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });
});

/* -------------------------------------------------------------------------- */
/*             Testing the main API scenarios with malicious user             */
/* -------------------------------------------------------------------------- */
describe("Testing the main API scenarios with malicious user", () => {
    let accountId;
    let accountToken;
    let articleId;
    let commentId;
    let companyId;
    let maliciousAccountToken;
    let maliciousProfileId;
    let accountPersonId;
    let accountCompanyId;

    beforeAll(async () => {
        await mongo.connect();
    });

    afterAll(() => {
        mongo.disconnect();
    });

    test("🧪 Create an account", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send(account);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.account.email).toBe(account.email);
        accountId = response.body.data.account.id;
    });

    test("🧪 Create a malicious account", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send(maliciousAccount);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.account.email).toBe(maliciousAccount.email);
        maliciousAccountId = response.body.data.account.id;
    });

    test("🧪 Create a user with same email", async () => {
        const response = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send(account);
        expect(response.statusCode).toBe(409);
    });

    test("🧪 Login", async () => {
        const response = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send({
            email: account.email,
            password: account.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.account.email).toBe(account.email);
        accountToken = response.body.data.token;
    });

    test("🧪 Login with malicious user", async () => {
        const response = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send({
            email: maliciousAccount.email,
            password: maliciousAccount.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.account.email).toBe(maliciousAccount.email);
        maliciousAccountToken = response.body.data.token;
    });

    test("🧪 Login with wrong email", async () => {
        const response = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send({
            email: "test",
            password: account.password
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Login with wrong password", async () => {
        const response = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send({
            email: account.email,
            password: "test"
        });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Get account profile", async () => {
        const response = await request(app).get(ACCOUNT_ENDPOINT)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.account.email).toBe(account.email);
        expect(response.body.data.account.id).toBe(accountId);
        expect(response.body.data.persons.length).toBe(0);
        expect(response.body.data.companies.length).toBe(0);
    });

    test("🧪 Create account person", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountPerson);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.person.firstName).toBe(accountPerson.expectedFirstName);
        expect(response.body.data.person.lastName).toBe(accountPerson.expectedLastName);
        expect(response.body.data.person.kind).toBe("Person");
        accountPersonId = response.body.data.person.id;
    });

    test("🧪 Create malicious account person", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", maliciousAccountToken)
            .send(maliciousAccountPerson);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.person.firstName).toBe(maliciousAccountPerson.expectedFirstName);
        expect(response.body.data.person.lastName).toBe(maliciousAccountPerson.expectedLastName);
        expect(response.body.data.person.kind).toBe("Person");
        maliciousProfileId = response.body.data.person.id;
    });

    test("🧪 Create account company", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountCompany);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.company.name).toBe(accountCompany.expectedName);
        expect(response.body.data.company.kind).toBe("Company");
        companyId = response.body.data.company.id;
    });

    test("🧪 Account should have 1 person and 1 company", async () => {
        const response = await request(app).get(ACCOUNT_ENDPOINT)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.account.email).toBe(account.email);
        expect(response.body.data.account.id).toBe(accountId);
        expect(response.body.data.persons.length).toBe(1);
        expect(response.body.data.companies.length).toBe(1);
    });

    test("🧪 Create a blog from person profile", async () => {
        const articleWithProfileId = Object.assign({}, article, { profileId: accountPersonId });
        const response = await request(app).post(BLOG_ENDPOINT)
            .set("Authorization", accountToken)
            .send(articleWithProfileId);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.article.title).toBe(article.title);
        expect(response.body.data.article.content).toBe(article.content);
        expect(response.body.data.article.author).toBe(accountPersonId);
        articleId = response.body.data.article.id;
    });

    test("🧪 Get blog from person profile", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}/${articleId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.title).toBe(article.title);
        expect(response.body.data.article.content).toBe(article.content);
        expect(response.body.data.article.author).toBe(accountPersonId);
    });

    test("🧪 Edit person blog title", async () => {
        const response = await request(app).put(`${BLOG_ENDPOINT}/${articleId}`)
            .set("Authorization", accountToken)
            .send({ title: "New title", profileId: accountPersonId });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.title).toBe("New title");
        expect(response.body.data.article.content).toBe(article.content);
        expect(response.body.data.article.author).toBe(accountPersonId);
    });

    test("🧪 Edit person blog content", async () => {
        const response = await request(app).put(`${BLOG_ENDPOINT}/${articleId}`)
            .set("Authorization", accountToken)
            .send({ content: "New content", profileId: accountPersonId });
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.title).toBe("New title");
        expect(response.body.data.article.content).toBe("New content");
        expect(response.body.data.article.author).toBe(accountPersonId);
    });

    test("🧪 Create a blog from person company", async () => {
        // merge article and profileId
        const articleWithProfileId = Object.assign({}, article, { profileId: companyId });
        const response = await request(app).post(BLOG_ENDPOINT)
            .set("Authorization", accountToken)
            .send(articleWithProfileId);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.article.title).toBe(article.title);
        expect(response.body.data.article.content).toBe(article.content);
        expect(response.body.data.article.author).toBe(companyId);
    });

    test("🧪 There should be 2 blogs", async () => {
        const response = await request(app).get(BLOG_ENDPOINT);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(2);
    });

    test("🧪 There should be 0 comments on person blog", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.comments.length).toBe(0);
    });

    test("🧪 Create a comment on person blog", async () => {
        const commentWithProfileId = Object.assign({}, comment, { profileId: accountPersonId });
        const response = await request(app).post(`${BLOG_ENDPOINT}/${articleId}/comments`)
            .set("Authorization", accountToken)
            .send(commentWithProfileId);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.comment.content).toBe(comment.content);
        expect(response.body.data.comment.author).toBe(accountPersonId);
        commentId = response.body.data.comment.id;
    });

    test("🧪 There should be 1 comment on person blog", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}/${articleId}/comments`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.comments.length).toBe(1);
    });

    test("🧪 Delete a comment on person blog without being author should fail", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/comments/${commentId}?profileId=${maliciousProfileId}`)
            .set("Authorization", maliciousAccountToken);
        expect(response.statusCode).toBe(403);
    });

    test("🧪 Delete a comment on person blog without credentials should fail", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/comments/${commentId}`);
        expect(response.statusCode).toBe(401);
    });

    test("🧪 Delete a comment on person blog", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/comments/${commentId}?profileId=${accountPersonId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 There should be 0 comments on person blog", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.comments.length).toBe(0);
    });

    test("🧪 Create a comment on person blog with malicious person", async () => {
        const commentWithProfileId = Object.assign({}, comment, { profileId: maliciousProfileId });
        const response = await request(app).post(`${BLOG_ENDPOINT}/${articleId}/comments`)
            .set("Authorization", maliciousAccountToken)
            .send(commentWithProfileId);
        expect(response.statusCode).toBe(201);
        expect(response.body.data.comment.content).toBe(comment.content);
        expect(response.body.data.comment.author).toBe(maliciousProfileId);
        commentId = response.body.data.comment.id;
    });

    test("🧪 There should be 1 comment on person blog", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}/${articleId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.article.comments.length).toBe(1);
    });

    test("🧪 Delete a comment written by malicious person on person blog with malicious person", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/comments/${commentId}?profileId=${maliciousProfileId}`)
            .set("Authorization", maliciousAccountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete a blog from person profile without being author should fail", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/${articleId}?profileId=${maliciousProfileId}`)
            .set("Authorization", maliciousAccountToken);
        expect(response.statusCode).toBe(403);
    });

    test("🧪 Delete a blog from person profile without credentials should fail", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/${articleId}`);
        expect(response.statusCode).toBe(401);
    });

    test("🧪 Create 22 comments on person blog and check pagination", async () => {
        for (let i = 0; i < 22; i++) {
            const commentWithProfileId = Object.assign({}, comment, { profileId: accountPersonId });
            const response = await request(app).post(`${BLOG_ENDPOINT}/${articleId}/comments`)
                .set("Authorization", accountToken)
                .send(commentWithProfileId);
            expect(response.statusCode).toBe(201);
            expect(response.body.data.comment.content).toBe(comment.content);
            expect(response.body.data.comment.author).toBe(accountPersonId);
        }

        const response = await request(app).get(`${BLOG_ENDPOINT}/${articleId}/comments`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.comments.length).toBe(10);
        expect(response.body.data.maxPage).toBe(3);
        expect(response.body.data.currentPage).toBe(1);

        const response2 = await request(app).get(`${BLOG_ENDPOINT}/${articleId}/comments?page=2&limit=3`);
        expect(response2.statusCode).toBe(200);
        expect(response2.body.data.comments.length).toBe(3);
        expect(response2.body.data.maxPage).toBe(8);
        expect(response2.body.data.currentPage).toBe(2);
    });

    test("🧪 Create 22 blogs and check pagination", async () => {
        for (let i = 0; i < 22; i++) {
            blogContent = {
                title: uuidv4(),
                content: uuidv4(),
                profileId: accountPersonId
            };
            const response = await request(app).post(`${BLOG_ENDPOINT}`)
                .set("Authorization", accountToken)
                .send(blogContent);
            expect(response.statusCode).toBe(201);
            expect(response.body.data.article.title).toBe(blogContent.title);
            expect(response.body.data.article.author).toBe(accountPersonId);
        }

        const response = await request(app).get(`${BLOG_ENDPOINT}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(10);
        expect(response.body.data.maxPage).toBe(3);
        expect(response.body.data.currentPage).toBe(1);

        const response2 = await request(app).get(`${BLOG_ENDPOINT}?page=2&limit=3`);
        expect(response2.statusCode).toBe(200);
        expect(response2.body.data.articles.length).toBe(3);
        expect(response2.body.data.maxPage).toBe(8);
        expect(response2.body.data.currentPage).toBe(2);
    });

    test("🧪 Delete a blog from person profile", async () => {
        const response = await request(app).delete(`${BLOG_ENDPOINT}/${articleId}?profileId=${accountPersonId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete malicious account", async () => {
        const response = await request(app).delete(`${ACCOUNT_ENDPOINT}`)
            .set("Authorization", maliciousAccountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Delete account", async () => {
        const response = await request(app).delete(`${ACCOUNT_ENDPOINT}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 There should be 0 blogs", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });
});

/* -------------------------------------------------------------------------- */
/*                         TESTING PROFILE CONTROLLER                         */
/* -------------------------------------------------------------------------- */
describe("Testing Profile controller", () => {
    let accountId;
    let accountToken;
    let accountPersonId;
    let accountCompanyId;

    beforeAll(async () => {
        await mongo.connect();
    });

    afterAll(() => {
        mongo.disconnect();
    });
    test("🧪 Account creation", async () => {
        // create account
        const responseCreateAccount = await request(app).post(ACCOUNT_REGISTER_ENDPOINT).send(account);
        expect(responseCreateAccount.statusCode).toBe(201);
        expect(responseCreateAccount.body.data.account.email).toBe(account.email);
        accountId = responseCreateAccount.body.data.account.id;

        // login
        const responseLogin = await request(app).post(ACCOUNT_LOGIN_ENDPOINT).send(account);
        expect(responseLogin.statusCode).toBe(200);
        expect(responseLogin.body.data.account.email).toBe(account.email);
        accountToken = responseLogin.body.data.token;

        // create person profile
        const responseCreatePersonProfile = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountPerson);
        expect(responseCreatePersonProfile.statusCode).toBe(201);
        expect(responseCreatePersonProfile.body.data.person.firstName).toBe(accountPerson.expectedFirstName);
        expect(responseCreatePersonProfile.body.data.person.lastName).toBe(accountPerson.expectedLastName);
        expect(responseCreatePersonProfile.body.data.person.kind).toBe("Person");
        accountPersonId = responseCreatePersonProfile.body.data.person.id;

        // recreate person profile should fail
        const responseCreatePersonProfile2 = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountPerson);
        expect(responseCreatePersonProfile2.statusCode).toBe(409);

        // create company profile
        const responseCreateCompanyProfile = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountCompany);
        expect(responseCreateCompanyProfile.statusCode).toBe(201);
        expect(responseCreateCompanyProfile.body.data.company.name).toBe(accountCompany.expectedName);
        expect(responseCreateCompanyProfile.body.data.company.kind).toBe("Company");
        accountCompanyId = responseCreateCompanyProfile.body.data.company.id;

        // recreate company profile should fail
        const responseCreateCompanyProfile2 = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send(accountCompany);
        expect(responseCreateCompanyProfile2.statusCode).toBe(409);

        // create unknown kind profile should fail
        const responseCreateUnknownKindProfile = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send({ kind: "Unknown" });
        expect(responseCreateUnknownKindProfile.statusCode).toBe(400);
    });

    test("🧪 Person profile creation without lastName - should fail", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send({ firstName: "John", kind: "Person" });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Company profile creation without name - should fail", async () => {
        const response = await request(app).post(PROFILE_ENDPOINT)
            .set("Authorization", accountToken)
            .send({ kind: "Company" });
        expect(response.statusCode).toBe(400);
    });

    test("🧪 Person profile getter", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/${accountPersonId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.person.firstName).toBe(accountPerson.expectedFirstName);
        expect(response.body.data.person.lastName).toBe(accountPerson.expectedLastName);
        expect(response.body.data.person.kind).toBe("Person");
    });

    test("🧪 Company profile getter", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/${accountCompanyId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.company.name).toBe(accountCompany.expectedName);
        expect(response.body.data.company.kind).toBe("Company");
    });

    test("🧪 Unknown profile getter - should fail", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/123456789`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(404);
    });

    test("🧪 Account getter", async () => {
        const response = await request(app).get(PROFILE_ENDPOINT)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.persons.length).toBe(1);
        expect(response.body.data.companies.length).toBe(1);
        expect(response.body.data.persons[0].id).toBe(accountPersonId);
    });


    test("🧪 Person profile comment getter", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/${accountPersonId}/comments`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.comments.length).toBe(0);
    });

    test("🧪 Company profile comment getter", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/${accountCompanyId}/comments`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.comments.length).toBe(0);
    });

    test("🧪 Person profile articles getter", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/${accountPersonId}/articles`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });

    test("🧪 Company profile articles getter", async () => {
        const response = await request(app).get(`${PROFILE_ENDPOINT}/${accountCompanyId}/articles`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });

    test("🧪 Person profile deletion", async () => {
        const response = await request(app).delete(`${PROFILE_ENDPOINT}/${accountPersonId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Company profile deletion", async () => {
        const response = await request(app).delete(`${PROFILE_ENDPOINT}/${accountCompanyId}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Unknown profile deletion - should fail", async () => {
        const response = await request(app).delete(`${PROFILE_ENDPOINT}/123456789`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(404);
    });

    test("🧪 No article should left after deletion", async () => {
        const response = await request(app).get(`${BLOG_ENDPOINT}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.articles.length).toBe(0);
    });

    test("🧪 Account deletion", async () => {
        const response = await request(app).delete(`${ACCOUNT_ENDPOINT}`)
            .set("Authorization", accountToken);
        expect(response.statusCode).toBe(200);
    });
});

/* -------------------------------------------------------------------------- */
/*                            Testing API features                            */
/* -------------------------------------------------------------------------- */

describe("Testing API features", () => {

    test("🧪 Server should be alive", async () => {
        const response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
    });

    test("🧪 Easter egg", async () => {
        const response = await request(app).get(EASTER_EGG);
        expect(response.statusCode).toBe(418);
    });

    let blacklistedIp = "178.20.55.18";
    test("🧪 Call with blacklisted ip", async () => {
        const response = await request(app).get("/").set("X-Forwarded-For", blacklistedIp);
        expect(response.statusCode).toBe(403);
    });
});