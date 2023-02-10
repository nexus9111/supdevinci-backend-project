const routerUtils = require("./routerUtils");

// this will throw an error that will be caught by the error handler
exports.errorResponse = (req, errorObj, message) => {
    // req.statusCode is set here and used in the error handler
    // in app.js to send the correct status code
    req.statusCode = errorObj.code;
    throw new Error(errorObj.message + " - " + message);
};

exports.successResponse = (res, req, statusCode, data) => {
    res.header("Location", routerUtils.getFullUrl(req));
    return res.status(statusCode).json({
        success: true,
        data: data
    });
};

exports.safeDatabaseData = (dataBaseData) => {
    const safeDataBaseData = dataBaseData.toObject();
    delete safeDataBaseData.password;
    delete safeDataBaseData.type;
    delete safeDataBaseData.__v;
    delete safeDataBaseData._id;
    return safeDataBaseData;
};