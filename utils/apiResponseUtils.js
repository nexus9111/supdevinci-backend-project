
exports.errorResponse = (req, errorObj, message) => {
    // req.statusCode is set here and used in the error handler
    // in app.js to send the correct status code
    req.statusCode = errorObj.code;
    throw new Error(errorObj.message + " - " + message);
}
