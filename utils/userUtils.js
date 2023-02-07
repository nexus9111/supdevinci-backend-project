exports.safeUser = (user) => {
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    delete safeUser._id;
    delete safeUser.tokens;
    return safeUser;
}

exports.checkCanUpdateArticle = (article, user) => {
    if (canUpdate(article, user)) {
        return true;
    }
    
    req.statusCode = 403;
    throw new Error("You are not allowed to update this article");
}

exports.checkCanUpdateComment = (comment, user) => {
    if (canUpdate(comment, user)) {
        return true;
    }
    
    req.statusCode = 403;
    throw new Error("You are not allowed to update this comment");
}

const canUpdate = (content, user) => {
    if (content.author == user.id || user.role == "admin" || user.role == "superadmin") {
        return true;
    }
    
    return false
}
