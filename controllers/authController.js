const validator = require("email-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/vars");
const logger = require("../config/logger");
const errors = require("../config/errors");

const Article = require("../models/articleModels");
const Comment = require("../models/commentModels");
const Person = require("../models/personModels");
const Company = require("../models/companyModels");
const Account = require("../models/accountModels");

const securityUtils = require("../utils/securityUtils");
const userUtils = require("../utils/userUtils");
const responseUtils = require("../utils/apiResponseUtils");

const SALT_ROUNDS = 10;

exports.register = async (req, res, next) => {
    try {
        if (!validator.validate(req.body.email)) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "invalid email");
        }

        if (!securityUtils.isPasswordValid(req.body.password)) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "invalid password");
        }

        let accountWithExistingEmail = await Account.findOne({
            email: req.body.email
        });

        if (accountWithExistingEmail) {
            await new Promise(resolve => setTimeout(resolve, 300)); // wait .3s to prevent brute force
            responseUtils.errorResponse(req, errors.errors.CONFLICT, "email already registered");
        }

        //hash password
        let hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

        let newAccount = new Account({
            email: req.body.email,
            password: hashedPassword,
        });

        await newAccount.save();

        logger.info(`User ${newAccount.email} registered successfully`);

        return responseUtils.successResponse(res, req, 201, {
            message: "Account created successfully",
            account: responseUtils.safeDatabaseData(newAccount),
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        let account = await Account.findOne({ email: req.body.email });
        if (!account) {
            responseUtils.errorResponse(req, errors.errors.BAD_CREDENTIALS, "invalid email or password");
        }

        let isPasswordCorrect = await bcrypt.compare(req.body.password, account.password);
        if (!isPasswordCorrect) {
            responseUtils.errorResponse(req, errors.errors.BAD_CREDENTIALS, "invalid email or password");
        }

        //generate token
        let token = jwt.sign({ id: account.id }, JWT_SECRET, { expiresIn: "1d" });

        return responseUtils.successResponse(res, req, 200, {
            message: "Logged in successfully",
            token: "Bearer " + token,
            account: responseUtils.safeDatabaseData(account),
        });
    } catch (error) {
        next(error);
    }
};

exports.profile = async (req, res, next) => {
    try {
        // find persons and companies of the user
        let persons = await Person.find({ owner: req.connectedUser.id })
            .select("-owner -__v -_id")
            .sort({ createdAt: -1 });
        let companies = await Company.find({ owner: req.connectedUser.id })
            .select("-owner -__v -_id")
            .sort({ createdAt: -1 });

        return responseUtils.successResponse(res, req, 200, {
            message: "Profile fetched successfully",
            account: responseUtils.safeDatabaseData(req.connectedUser),
            persons: persons,
            companies: companies,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProfile = async (req, res, next) => {
    try {
        await Account.deleteOne({ id: req.connectedUser.id });

        // get all Persons and Companies of the user
        let persons = await Person.find({ owner: req.connectedUser.id });
        let companies = await Company.find({ owner: req.connectedUser.id });

        // delete all articles, comments of the persons and companies of the user
        for (let person of persons) {
            await Article.deleteMany({ author: person.id });
            await Comment.deleteMany({ author: person.id });
        }

        for (let company of companies) {
            await Article.deleteMany({ author: company.id });
            await Comment.deleteMany({ author: company.id });
        }

        // delete all persons and company of the user
        await Person.deleteMany({ owner: req.connectedUser.id });
        await Company.deleteMany({ owner: req.connectedUser.id });

        logger.info(`User ${req.connectedUser.email} deleted his profile`);

        return responseUtils.successResponse(res, req, 200, {
            message: "Profile deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/* istanbul ignore next */
exports.providerAuth = async (req, res, next) => {
    try {
        switch (req.provider) {
            case "google":
                let email = req.user.email.toLowerCase().trim();
                let status = 200;

                const account = await Account.findOne({ email: email });
                if (!account) {
                    account = new Account({
                        email: email,
                        type: req.provider, 
                    });

                    await account.save();
                    status = 201;
                }
                
                // generate token
                let token = jwt.sign({ id: account.id }, JWT_SECRET, { expiresIn: "1d" });

                return responseUtils.successResponse(res, req, status, {
                    message: status === 201 ? "Account created successfully" : "Logged in successfully",
                    account: responseUtils.safeDatabaseData(account),
                    token: "Bearer " + token,
                });
            default:
                responseUtils.errorResponse(req, errors.errors.NOT_ALREADY_IMPLEMENTED, "provider implemented yet");
                return;
        }
    } catch (error) {
        next(error);
    }
};