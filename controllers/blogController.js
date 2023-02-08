const Article = require("../models/articleModels");
const Comment = require("../models/commentModels");

const logger = require("../config/logger");
const errors = require("../config/errors");

const articleUtils = require("../utils/articleUtils");
const userUtils = require("../utils/userUtils");
const responseUtils = require("../utils/apiResponseUtils");

exports.getAll = async (req, res, next) => {
    try {
        let pageSize = parseInt(req.query.pageSize) || 10;
        let page = parseInt(req.query.page) || 1;
        let skip = (page - 1) * pageSize;

        let author = req.query.author;
        let dbQuery = {};
        if (author) {
            dbQuery = { author: author };
        }
        let articles = await articleUtils.getArticles(pageSize, skip, dbQuery);

        return responseUtils.successResponse(res, 200, {
            articles: articles
        });
    } catch (error) {
        next(error);
    }
}

exports.getOne = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        // get all comments
        let comments = await Comment.find({ article: article.id })
            .select('-__v')
            .select('-_id')
            .sort({ date: -1 });

        // add comments to article
        article = articleUtils.safeArticle(article);
        article.comments = comments;

        return responseUtils.successResponse(res, 200, {
            article: article
        });
    } catch (error) {
        next(error);
    }
}

exports.create = async (req, res, next) => {
    try {
        if (!req.body.title || !req.body.content) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing title or content");
        }

        articleUtils.checkArticleTitle(req, req.body.title)

        let article = new Article({
            author: req.connectedUser.id,
            title: req.body.title,
            content: req.body.content
        });

        article = await article.save();

        logger.info(`Article created successfully`, {
            title: article.title,
        });

        return responseUtils.successResponse(res, 201, {
            message: "Article created successfully",
            article: articleUtils.safeArticle(article)
        });
    } catch (error) {
        next(error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        userUtils.checkCanUpdateArticle(req, article, req.connectedUser);

        await Article.deleteOne({ id: req.params.id });

        await Comment.deleteMany({ article: req.params.id });

        return responseUtils.successResponse(res, 200, {
            message: "Article deleted successfully"
        });
    } catch (error) {
        next(error);
    }
}

exports.update = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        userUtils.checkCanUpdateArticle(req, article, req.connectedUser);

        if (req.body.title) {
            articleUtils.checkArticleTitle(req, req.body.title)
            article.title = req.body.title;
        }


        if (req.body.content) {
            article.content = req.body.content;
        }

        article.lastUpdated = new Date();

        await Article.updateOne({ id: req.params.id }, article);

        return responseUtils.successResponse(res, 200, {
            message: "Article updated successfully",
            article: articleUtils.safeArticle(article)
        });
    } catch (error) {
        next(error);
    }
}

exports.getCommentsFromArticle = async (req, res, next) => {
    try {
        let comments = await Comment.find({ article: req.params.id })
            .select('-__v')
            .select('-_id')
            .sort({ date: -1 });

        return responseUtils.successResponse(res, 200, {
            comments: comments
        });
    } catch (error) {
        next(error);
    }
}

exports.comment = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });
        if (!req.body.comment) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing comment");
        }

        let comment = new Comment({
            author: req.connectedUser.id,
            article: article.id,
            authorName: req.connectedUser.username,
            comment: req.body.comment
        });

        comment = await comment.save();

        logger.info(`Comment created successfully`, {
            id: comment.id,
            article: comment.article,
            author: comment.author
        });

        return responseUtils.successResponse(res, 201, {
            message: "Comment created successfully",
            comment: comment
        });
    } catch (error) {
        next(error);
    }
}

exports.deleteComment = async (req, res, next) => {
    try {
        let comment = await Comment.findOne({ id: req.params.id });
        if (!comment) {
            responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "comment not found");
        }

        userUtils.checkCanUpdateComment(req, comment, req.connectedUser);

        await Comment.deleteOne({ id: req.params.id });

        return responseUtils.successResponse(res, 200, {
            message: "Comment deleted successfully"
        });
    } catch (error) {
        next(error);
    }
}