const errors = require("../config/errors");

const responseUtils = require("../utils/apiResponseUtils");

/* istanbul ignore next */
exports.safeDatabaseData = (dataBaseData) => {
    const safeDataBaseData = dataBaseData.toObject();
    delete safeDataBaseData.password;
    delete safeDataBaseData.__v;
    delete safeDataBaseData._id;
    return safeDataBaseData;
};