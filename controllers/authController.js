const validator = require("email-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/vars");
const logger = require("../config/logger");

const securityUtils = require("../utils/securityUtils");
const userUtils = require("../utils/userUtils");

const User = require("../models/userModels");

const DELAY_ONE_DAY = 86_400_000;
const SALT_ROUNDS = 10;

exports.register = async (req, res, next) => {
    try {
        //check body
        if (!req.body.email || !req.body.password || !req.body.username) {
            req.statusCode = 400;
            throw new Error("Please provide email, password and username");
        }

        //check if email is valid
        if (!validator.validate(req.body.email)) {
            req.statusCode = 400;
            throw new Error("Please provide a valid email");
        }

        //check if password is valid
        if (!securityUtils.isPasswordValid(req.body.password)) {
            req.statusCode = 400;
            throw new Error("Password is not valid");
        }

        //check if email is already registered from email or username
        let user = await User.findOne({ $or: [{ email: req.body.email.toLowerCase() }, { username: req.body.username }] });
        if (user) {
            req.statusCode = 400;
            throw new Error("Email or username is already registered");
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
            req.statusCode = 400;
            throw new Error("Please provide email and password");
        }

        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            req.statusCode = 400;
            throw new Error("Email is not registered");
        }

        let isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) {
            req.statusCode = 403;
            throw new Error("Credentials are not correct");
        }

        //generate token
        let token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

        //update user token
        user.tokens.push({
            token: token,
            expires: Date.now() + DELAY_ONE_DAY
        });

        // delete all expired tokens from user
        user.tokens = user.tokens.filter(t => t.expires > Date.now());

        await user.save();

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
            req.statusCode = 400;
            throw new Error("User not found");
        }

        if (!userUtils.canModifyProfile(user, req.connectedUser)) {
            logger.warning(`User ${req.connectedUser.username} tried to delete ${user.username} profile`);
            req.statusCode = 403;
            throw new Error("You can't delete this profile");
        }
        
        logger.info(`User ${req.connectedUser.username} deleted ${user.username} profile`);
        await user.remove();

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