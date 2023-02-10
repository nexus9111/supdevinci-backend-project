const mongoose = require("mongoose");
const { MONGOOSE_URI } = require("./vars");
const logger = require("./logger");

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);

/* istanbul ignore next */
exports.connect = async () => {
    // test randomly failed because of this
    // so I added a promise to make sure it's connected
    return new Promise((resolve, reject) => {
        mongoose.connect(MONGOOSE_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => {
                logger.info("✅ MongoDB Connection Succeeded. URL: " + MONGOOSE_URI);
                return resolve();
            })
            .catch((error) => {
                logger.error("❌ MongoDB Connection Failed. URL: " + MONGOOSE_URI);
                return reject(error);
            });
    });
};

exports.disconnect = () => {
    mongoose.disconnect();
    logger.info("✅ MongoDB Disconnected");
};
