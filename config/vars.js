// eslint-disable-next-line unicorn/prevent-abbreviations
require("dotenv-safe").config({ path: `.env.${process.env.NODE_ENV}` });

module.exports = {
    ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGOOSE_URI: process.env.MONGODB_URI,
    USE_DATABASE: process.env.USE_DATABASE === "1" ? true : false,
    JWT_SECRET: process.env.JWT_SECRET,
    RATE_LIMITER: Number.parseInt(process.env.RATE_LIMITER, 10),
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BLACKLIST: ["178.20.55.18"]
}; 