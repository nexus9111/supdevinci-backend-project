const logger = require('../config/logger');

exports.log = (req) => {
    logger.debug(`${req.ipAddress} called route (${req.method}) => ${req.originalUrl}`);
};