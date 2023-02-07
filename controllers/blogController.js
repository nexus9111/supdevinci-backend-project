const Article = require("../models/articleModels");
const Comment = require("../models/commentModels");

const logger = require("../config/logger");

const articleUtils = require("../utils/articleUtils");
const userUtils = require("../utils/userUtils");

exports.coming = (req, res, next) => {
    try {
        throw new Error("Coming soon");
    } catch (error) {
        next(error);
    }
}

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

        return res.status(200).json({
            success: true,
            data: {
                articles: articles
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.getOne = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        return res.status(200).json({
            success: true,
            data: {
                article: articleUtils.safeArticle(article)
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.create = async (req, res, next) => {
    try {
        if (!req.body.title || !req.body.content) {
            req.statusCode = 400;
            throw new Error("Please provide title and content");
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

        return res.status(201).json({
            success: true,
            data: {
                message: "Article created successfully",
                article: articleUtils.safeArticle(article)
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        userUtils.checkCanUpdateArticle(article, req.connectedUser);

        await Article.deleteOne({ id: req.params.id });

        return res.status(200).json({
            success: true,
            data: {
                message: "Article deleted successfully"
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.update = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });

        userUtils.checkCanUpdateArticle(article, req.connectedUser);

        if (req.body.title) {
            articleUtils.checkArticleTitle(req.body.title)
            article.title = req.body.title;
        }

        
        if (req.body.content) {
            article.content = req.body.content;
        }
        
        article = await article.save();
        
        return res.status(200).json({
            success: true,
            data: {
                message: "Article updated successfully",
                article: articleUtils.safeArticle(article)
            }
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

        return res.status(200).json({
            success: true,
            data: {
                comments: comments
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.comment = async (req, res, next) => {
    try {
        let article = await articleUtils.getOneArticle(req, { id: req.params.id });
        if (!req.body.comment) {
            req.statusCode = 400;
            throw new Error("Please provide content");
        }

        let comment = new Comment({
            author: req.connectedUser.id,
            article: article.id,
            authorName: req.connectedUser.username,
            comment: req.body.comment
        });

        comment = await comment.save();

        logger.info(`Comment created successfully`, {
            article: comment.article,
            author: comment.author,
            comment: comment.comment
        });

        return res.status(201).json({
            success: true,
            data: {
                message: "Comment created successfully",
                comment: comment
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.deleteComment = async (req, res, next) => {
    try {
        let comment = await Comment.findOne({ id: req.params.id });
        if (!comment) {
            req.statusCode = 404;
            throw new Error("Comment not found");
        }

        userUtils.checkCanUpdateComment(comment, req.connectedUser);

        await Comment.deleteOne({ id: req.params.id });

        return res.status(200).json({
            success: true,
            data: {
                message: "Comment deleted successfully"
            }
        });
    } catch (error) {
        next(error);
    }
}