const passwordValidator = require("password-validator");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/vars");
const logger = require("../config/logger");
const errors = require("../config/errors");

const Account = require("../models/accountModels");
const Company = require("../models/companyModels");
const Person = require("../models/personModels");

const responseUtils = require("../utils/apiResponseUtils");


let schema = new passwordValidator();

schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits()                                 // Must have digits
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(["Passw0rd", "Password123"]); // Blacklist these values

exports.isPasswordValid = (password) => {
    return schema.validate(password);
};

const getConnectedUser = async (req) => {
    let token = req.headers.authorization;
    let decoded;
    if (!token) {
        responseUtils.errorResponse(req, errors.errors.UNAUTHORIZED, "missing token");
    };

    try {
        token = token.split(" ")[1];
        decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            throw new Error("invalid token");
        }
    } catch {
        responseUtils.errorResponse(req, errors.errors.UNAUTHORIZED, "invalid token");
    }

    let now = new Date();
    if (now > decoded.expires) {
        responseUtils.errorResponse(req, errors.errors.UNAUTHORIZED, "token expired");
    }

    let user = await Account.findOne({ id: decoded.id }).select("-__v");

    if (!user) {
        responseUtils.errorResponse(req, errors.errors.UNAUTHORIZED, "user with given token not found");
    }

    req.connectedUser = user;
};

exports.authenticate = async (req, res, next) => {
    try {
        await getConnectedUser(req);

        next();
    } catch (error) {
        next(error);
    }
};

exports.authenticateProfile = async (req, res, next) => {
    try {
        let profileId;
        if (!req.body.profileId) {
            if (!req.query.profileId) {
                responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing profileId");
            }
            profileId = req.query.profileId;
        } else {
            profileId = req.body.profileId;
        }

        let person = await Person.findOne({ id: profileId })
            .select("-__v -_id");

        if (person && person.owner === req.connectedUser.id) {
            req.profile = person;
            req.profileType = "Person";
            return next();
        }

        let company = await Company.findOne({ id: profileId })
            .select("-__v -_id");

        if (company && company.owner === req.connectedUser.id) {
            req.profile = company;
            req.profileType = "Company";
            return next();
        }

        return responseUtils.errorResponse(req, errors.errors.UNAUTHORIZED, "unauthorized");
    } catch (error) {
        next(error);
    }
};

exports.checkBody = (req, res, next) => {
    try {
        if (!req.body.email || !req.body.password) {
            responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing email, password");
        }
        req.body.email = req.body.email.toLowerCase().trim();
        next();
    } catch (error) {
        next(error);
    }
};