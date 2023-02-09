const errors = require("../config/errors");

const responseUtils = require("../utils/apiResponseUtils");

exports.safeDatabaseData = (dataBaseData) => {
    const safeDataBaseData = dataBaseData.toObject();
    delete safeDataBaseData.password;
    delete safeDataBaseData.__v;
    delete safeDataBaseData._id;
    return safeDataBaseData;
};

exports.canModifyProfile = (user, connectedUser) => {
    // a superadmin can't be deleted
    if (user.role === "superadmin") {
        return false;
    }

    // a superadmin can delete any user except a superadmin
    if (connectedUser.role === "superadmin") {
        return true;
    }

    // a user can't delete an admin
    if (user.role === "admin" && connectedUser.role === "user") {
        return false;
    }

    // a user can only delete his own profile
    if (user.id !== connectedUser.id && connectedUser.role === "user") {
        return false;
    }

    // an admin can't delete another admin
    if (user.id !== connectedUser.id && connectedUser.role === user.role) {
        return false;
    }

    return true;
};