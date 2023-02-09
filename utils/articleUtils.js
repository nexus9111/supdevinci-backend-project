const errors = require("../config/errors");

const Article = require("../models/articleModels");

const responseUtils = require("../utils/apiResponseUtils");

exports.safeArticle = (article) => {
    const safeUser = article.toObject();
    delete safeUser.__v;
    delete safeUser._id;
    return safeUser;
};

exports.checkArticleTitle = (req, title) => {
    if (title.length >= 5 && title.length <= 100) {
        return true;
    }
    responseUtils.errorResponse(req, errors.errors.BAD_BODY, "title must be between 5 and 100 characters");
};

exports.getOneArticle = async (req, query = {}) => {
    let article = await Article.findOne(query)
        .select("-__v -_id");

    if (!article) {
        responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "article not found");
    }

    return article;
};

exports.getArticles = async (pageSize, skip, databaseQuery = {}) => {
    // eslint-disable-next-line unicorn/no-array-callback-reference
    let article = await Article.find(databaseQuery)
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .select("-__v")
        .select("-_id");

    return article;
};
