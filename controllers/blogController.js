const Article = require("../models/articleModels");

const logger = require("../config/logger");

const articleUtils = require("../utils/articleUtils");

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

        let articles = await Article.find(dbQuery)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .select('-__v')
            .select('-_id');

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
        let article = await Article.findOne({ id: req.params.id })
            .select('-__v')
            .select('-_id');
        if (!article) {
            req.statusCode = 404;
            throw new Error("Article not found");
        }

        return res.status(200).json({
            success: true,
            data: {
                article: article
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

        if (!articleUtils._title_validator(req.body.title)) {
            req.statusCode = 400;
            throw new Error("Title must be between 5 and 100 characters");
        }

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
        let article = await Article.findOne({ id: req.params.id });
        if (!article) {
            req.statusCode = 404;
            throw new Error("Article not found");
        }

        if (article.author != req.connectedUser.id && req.connectedUser.role != "admin" && req.connectedUser.role != "superadmin") {
            req.statusCode = 403;
            throw new Error("You are not allowed to delete this article");
        }

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
        let article = await Article.findOne({ id: req.params.id });
        if (!article) {
            req.statusCode = 404;
            throw new Error("Article not found");
        }

        if (article.author != req.connectedUser.id && req.connectedUser.role != "admin" && req.connectedUser.role != "superadmin") {
            req.statusCode = 403;
            throw new Error("You are not allowed to update this article");
        }

        if (req.body.title) {
            if (!articleUtils._title_validator(req.body.title)) {
                req.statusCode = 400;
                throw new Error("Title must be between 5 and 100 characters");
            }
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