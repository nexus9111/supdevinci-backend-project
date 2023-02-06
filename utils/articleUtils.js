exports.safeArticle = (article) => {
    const safeUser = article.toObject();
    delete safeUser.__v;
    delete safeUser._id;
    return safeUser;
}