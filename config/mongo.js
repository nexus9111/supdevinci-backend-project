const mongoose = require("mongoose");
const { MONGOOSE_URI } = require('./vars');
const logger = require('./logger');

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);

exports.connect = () => {
    mongoose.connect(MONGOOSE_URI, {useNewUrlParser: true, useUnifiedTopology: true}, (error) => {
        if (!error) {
            logger.info("✅ MongoDB Connection Succeeded. URL: " + MONGOOSE_URI);
        } else {
            logger.error("❌ MongoDB Connection Failed. URL: " + MONGOOSE_URI);
        }
    });
};