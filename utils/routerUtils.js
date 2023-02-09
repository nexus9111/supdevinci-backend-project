const logger = require("../config/logger");

const getFullUrl = (req) => {
    const url = req.protocol + "://" + req.get("host") + req.originalUrl;
    return url;
};

exports.log = (req) => {
    logger.debug(`${req.ipAddress} called route (${req.method}) => ${getFullUrl(req)}`);
};

exports.getFullUrl = getFullUrl;