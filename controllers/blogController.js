const Article = require("../models/articleModels");
const Comment = require("../models/commentModels");

const logger = require("../config/logger");
const errors = require("../config/errors");

const articleUtils = require("../utils/articleUtils");
const userUtils = require("../utils/userUtils");
const responseUtils = require("../utils/apiResponseUtils");

exports.getAll = async (req, res, next) => {
    try {
        let pageSize = Number.parseInt(req.query.limit) || 10;
        let page = Number.parseInt(req.query.page) || 1;
        let skip = (page - 1) * pageSize;

        let author = req.query.author;
        let databaseQuery = {};
        if (author) {
            databaseQuery = { author: author };
        }
        let articles = await articleUtils.getArticles(pageSize, skip, databaseQuery);

        let articlesCount = await Article.countDocuments(databaseQuery);

        return responseUtils.successResponse(res, req, 200, {
            articles: articles,
            maxPage: Math.ceil(articlesCount / pageSize),
            pageSize: pageSize,
            currentPage: page
        });
    } catch (error) {
        next(error);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        // get all comments
        let comments = await Comment.find({ article: article.id })
            .select("-__v")
            .select("-_id")
            .sort({ date: -1 });

        // add comments to article
        article = articleUtils.safeArticle(article);
        article.comments = comments;

        return responseUtils.successResponse(res, req, 200, {
            article: article
        });
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        if (!req.body.title || !req.body.content) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing title or content");
        }

        articleUtils.checkArticleTitle(req, req.body.title);

        let article = new Article({
            author: req.profile.id,
            title: req.body.title,
            content: req.body.content
        });

        article = await article.save();

        logger.info("Article created successfully", {
            title: article.title,
        });

        return responseUtils.successResponse(res, req, 201, {
            message: "Article created successfully",
            article: articleUtils.safeArticle(article)
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        if (article.author !== req.profile.id) {
            responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "you can't delete this article");
        }

        await Article.deleteOne({ id: req.params.id });

        await Comment.deleteMany({ article: req.params.id });

        return responseUtils.successResponse(res, req, 200, {
            message: "Article deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        if (article.author !== req.profile.id) {
            responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "you can't update this article");
        }

        if (req.body.title) {
            articleUtils.checkArticleTitle(req, req.body.title);
            article.title = req.body.title;
        }


        if (req.body.content) {
            article.content = req.body.content;
        }

        article.lastUpdated = new Date();

        await Article.updateOne({ id: req.params.id }, article);

        return responseUtils.successResponse(res, req, 200, {
            message: "Article updated successfully",
            article: articleUtils.safeArticle(article)
        });
    } catch (error) {
        next(error);
    }
};

exports.getCommentsFromArticle = async (req, res, next) => {
    try {
        let pageSize = Number.parseInt(req.query.limit) || 10;
        let page = Number.parseInt(req.query.page) || 1;
        let skip = (page - 1) * pageSize;

        let article = await articleUtils.getOneArticle(req, { id: req.params.id });
        if (!article) {
            responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "article not found");
        }

        let comments = await Comment.find({ article: req.params.id })
            .skip(skip)
            .limit(pageSize)
            .select("-__v -_id")
            .sort({ date: -1 });

        let commentsCount = await Comment.countDocuments({ article: req.params.id });

        return responseUtils.successResponse(res, req, 200, {
            comments: comments,
            maxPage: Math.ceil(commentsCount / pageSize),
            pageSize: pageSize,
            currentPage: page
        });
    } catch (error) {
        next(error);
    }
};

exports.comment = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });
        if (!req.body.comment) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing comment");
        }

        let comment = new Comment({
            author: req.profile.id,
            article: article.id,
            authorName: req.profileType === "Person" ? req.profile.firstName + " " + req.profile.lastName : req.profile.name,
            comment: req.body.comment
        });

        comment = await comment.save();

        logger.info("Comment created successfully", {
            id: comment.id,
            article: comment.article,
            author: comment.author
        });

        return responseUtils.successResponse(res, req, 201, {
            message: "Comment created successfully",
            comment: comment
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        let comment = await Comment.findOne({ id: req.params.id });
        if (!comment) {
            responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "comment not found");
        }

        if (comment.author !== req.profile.id) {
            responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "you are not allowed to delete this comment");
        }

        await Comment.deleteOne({ id: req.params.id });

        return responseUtils.successResponse(res, req, 200, {
            message: "Comment deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};