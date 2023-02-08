const validator = require("email-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/vars");
const logger = require("../config/logger");
const errors = require('../config/errors');

const User = require("../models/userModels");
const Article = require("../models/articleModels");
const Comment = require("../models/commentModels");

const securityUtils = require("../utils/securityUtils");
const userUtils = require("../utils/userUtils");
const responseUtils = require("../utils/apiResponseUtils");

const SALT_ROUNDS = 10;

exports.register = async (req, res, next) => {
    try {
        //check body
        if (!req.body.email || !req.body.password || !req.body.username) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing email, password or username");
        }

        //check if email is valid
        if (!validator.validate(req.body.email)) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "invalid email");
        }

        //check if password is valid
        if (!securityUtils.isPasswordValid(req.body.password)) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "invalid password");
        }

        //check if email is already registered from email or username
        let user = await User.findOne({
            $or: [
                { email: req.body.email.toLowerCase().trim() },
                { username: req.body.username }
            ]
        });
        if (user) {
            responseUtils.errorResponse(req, errors.errors.CONFLICT, "email or username already registered");
        }

        //hash password
        let hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);

        let newUser = new User({
            username: req.body.username,
            password: hash,
            email: req.body.email.toLowerCase()
        });

        user = await newUser.save();

        logger.info(`User ${user.username} registered successfully`);

        return res.status(201).json({
            success: true,
            data: {
                message: "User registered successfully",
                user: userUtils.safeUser(user),
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        if (!req.body.email || !req.body.password) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing email or password");
        }

        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            responseUtils.errorResponse(req, errors.errors.BAD_CREDENTIALS, "invalid email or password");
        }

        let isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) {
            responseUtils.errorResponse(req, errors.errors.BAD_CREDENTIALS, "invalid email or password");
        }

        //generate token
        let token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

        //send response
        return res.status(200).json({
            success: true,
            data: {
                message: "Login successful",
                token: token,
                user: userUtils.safeUser(user),
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.profile = async (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                message: "Profile",
                user: userUtils.safeUser(req.connectedUser),
            }
        });
    } catch (error) {
        next(error);
    }
}

exports.deleteProfile = async (req, res, next) => {
    try {
        let user = await User.findOne({ id: req.params.id });
        if (!user) {
            responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "user not found");
        }

        if (!userUtils.canModifyProfile(user, req.connectedUser)) {
            logger.warning(`User ${req.connectedUser.username} tried to delete ${user.username} profile`);
            responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "you can't delete this profile");
        }

        logger.info(`User ${req.connectedUser.username} deleted ${user.username} profile`);
        await user.remove();

        // delete all articles of the user and all comments of the user
        await Article.deleteMany({ author: user.id });
        await Comment.deleteMany({ author: user.id });

        return res.status(200).json({
            success: true,
            data: {
                message: "Profile deleted",
            }
        });
    } catch (error) {
        next(error);
    }
}