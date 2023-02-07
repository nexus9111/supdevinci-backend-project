const Article = require("../models/articleModels");

exports.safeArticle = (article) => {
    const safeUser = article.toObject();
    delete safeUser.__v;
    delete safeUser._id;
    return safeUser;
}

exports.checkArticleTitle = (req, title) => {
    if (title.length >= 5 && title.length <= 100) {
        return true;
    }
    req.statusCode = 400;
    throw new Error("Title must be between 5 and 100 characters");
}

exports.getOneArticle = async (req, query = {}) => {
    let article = await Article.findOne(query)
        .select('-__v');

    if (!article) {
        req.statusCode = 404;
        throw new Error("Article not found");
    }

    return article;
}

exports.getArticles = async (pageSize, skip, query = {}) => {
    let article = await Article.find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .select('-__v')
        .select('-_id');

    return article;
}
