// exports.errors = {
//     BAD_BODY: "Bad body",
//     BAD_CREDENTIALS: "Bad credentials",
//     UNAUTHORIZED: "Unauthorized",
//     FORBIDDEN: "Forbidden",
//     NOT_FOUND: "Not found",
//     CONFLICT: "Conflict",
// };

exports.errors = {
    BAD_BODY: {
        message: "Bad body",
        code: 400
    },
    UNAUTHORIZED: {
        message: "Unauthorized",
        code: 401
    },
    FORBIDDEN: {
        message: "Forbidden",
        code: 403
    },
    NOT_FOUND: {
        message: "Not found",
        code: 404
    },
    CONFLICT: {
        message: "Conflict",
        code: 409
    },
    BAD_CREDENTIALS: {
        message: "Bad credentials",
        code: 400
    },
};
