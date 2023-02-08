const errors = require('../config/errors');

const responseUtils = require("../utils/apiResponseUtils");

exports.safeUser = (user) => {
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    delete safeUser._id;
    delete safeUser.tokens;
    return safeUser;
}

exports.checkCanUpdateArticle = (req, article, user) => {
    if (canUpdate(article, user)) {
        return true;
    }
    
    responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "not allowed to update this article");
}

exports.checkCanUpdateComment = (req, comment, user) => {
    if (canUpdate(comment, user)) {
        return true;
    }
    
    responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "not allowed to update this comment");
}

const canUpdate = (content, user) => {
    if (content.author === user.id || user.role === "admin" || user.role === "superadmin") {
        return true;
    }
    
    return false
}

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
}