const app = require("./app");
const mongo = require("./config/mongo");
const logger = require("./config/logger");

const { PORT, ENV, BLACKLIST, USE_DATABASE } = require("./config/vars");

// if (USE_DATABASE) {
//     mongo.connect();
// } else {
//     logger.info("Database disabled");
// }
// make it in an async function
// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
    if (USE_DATABASE) {
        await mongo.connect();
    } else {
        logger.info("Database disabled");
    }
})();

app.listen(PORT, () => {
    logger.info(`Application running in ${ENV} mode`, {
        "port": PORT,
        "blacklist ips": BLACKLIST,
        "url": `http://localhost:${PORT}`
    });
});


// boilerplate author : Joss C.
// github : https://github.com/nexus9111
// 
// Please do not remove this comment if you use this code, this is your thanks for my work