exports.safeArticle = (article) => {
    const safeUser = article.toObject();
    delete safeUser.__v;
    delete safeUser._id;
    return safeUser;
}

exports._title_validator = (title) => {
    return title.length >= 5 && title.length <= 100;
}