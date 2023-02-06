require("dotenv-safe").config({ path: `.env.${process.env.NODE_ENV}` });

module.exports = {
    ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGOOSE_URI: process.env.MONGODB_URI,
    USE_DATABASE: process.env.USE_DATABASE === "1" ? true : false,
    JWT_SECRET: process.env.JWT_SECRET,
    BLACKLIST: ["178.20.55.18"]
} 