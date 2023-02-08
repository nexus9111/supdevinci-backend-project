const validator = require("email-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/vars");
const logger = require("../config/logger");
const errors = require("../config/errors");

const Article = require("../models/articleModels");
const Comment = require("../models/commentModels");
const Person = require("../models/personModels");

const securityUtils = require("../utils/securityUtils");
const userUtils = require("../utils/userUtils");
const responseUtils = require("../utils/apiResponseUtils");

const SALT_ROUNDS = 10;


const registerPerson = async (req) => {
    if (!req.body.email || !req.body.password || !req.body.username) {
        responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing email, password or username");
    }

    if (!validator.validate(req.body.email)) {
        responseUtils.errorResponse(req, errors.errors.BAD_BODY, "invalid email");
    }

    if (!securityUtils.isPasswordValid(req.body.password)) {
        responseUtils.errorResponse(req, errors.errors.BAD_BODY, "invalid password");
    }

    let userWithExistingEmail = await Person.findOne({
        $or: [
            { email: req.body.email.toLowerCase().trim() },
            { username: req.body.username }
        ]
    });
    if (userWithExistingEmail) {
        await new Promise(resolve => setTimeout(resolve, 300)); // wait .3s to prevent brute force
        responseUtils.errorResponse(req, errors.errors.CONFLICT, "email or username already registered");
    }

    //hash password
    let hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

    let newUser = await Person.create({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email.toLowerCase().trim(),
    });

    user = await newUser.save();
    return user;
};

exports.register = async (req, res, next) => {
    try {
        switch (req.body.kind) {
            case "person":
                let newPerson = await registerPerson(req);
                logger.info(`User ${user.username} registered successfully`);
                
                return responseUtils.successResponse(res, 201, {
                    message: "User registered successfully",
                    user: userUtils.safeUser(newPerson),
                });
            case "company":
                responseUtils.errorResponse(req, errors.errors.NOT_ALREADY_IMPLEMENTED, "this feature is not already implemented");
                break;
            default:
                responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing kind");
                break;
        }
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        if (!req.body.email || !req.body.password) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing email or password");
        }

        let user = await Person.findOne({ email: req.body.email });
        if (!user) {
            responseUtils.errorResponse(req, errors.errors.BAD_CREDENTIALS, "invalid email or password");
        }

        let isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) {
            responseUtils.errorResponse(req, errors.errors.BAD_CREDENTIALS, "invalid email or password");
        }

        //generate token
        let token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

        return responseUtils.successResponse(res, 200, {
            message: "Login successful",
            token: token,
            user: userUtils.safeUser(user),
        });
    } catch (error) {
        next(error);
    }
};

exports.profile = async (req, res, next) => {
    try {
        return responseUtils.successResponse(res, 200, {
            message: "Profile fetched successfully",
            user: userUtils.safeUser(req.connectedUser),
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProfile = async (req, res, next) => {
    try {
        let user = await Person.findOne({ id: req.params.id });
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

        return responseUtils.successResponse(res, 200, {
            message: "Profile deleted",
        });
    } catch (error) {
        next(error);
    }
};