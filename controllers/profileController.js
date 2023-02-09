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

const securityUtils = require("../utils/securityUtils");
const userUtils = require("../utils/userUtils");
const responseUtils = require("../utils/apiResponseUtils");

const SALT_ROUNDS = 10;


const registerPerson = async (req) => {
    if (!req.body.firstName || !req.body.lastName) {
        responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing firstName or lastName");
    }

    let firstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1).toLowerCase();
    let lastName = req.body.lastName.toUpperCase();

    let personWithExistingName = await Person.findOne({
        $and: [
            { firstName: firstName },
            { lastName: lastName },
        ],
    });
    if (personWithExistingName) {
        responseUtils.errorResponse(req, errors.errors.CONFLICT, "person with this name already registered");
    }

    let newPerson = await Person.create({
        owner: req.connectedUser.id,
        firstName: firstName,
        lastName: lastName,

    });

    let person = await newPerson.save();
    return person;
};

const registerCompany = async (req) => {
    if (!req.body.name) {
        responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing name");
    }

    let name = req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1).toLowerCase();

    let companyWithExistingName = await Company.findOne({
        $and: [
            { name: name },
        ],
    });
    if (companyWithExistingName) {
        responseUtils.errorResponse(req, errors.errors.CONFLICT, "person with this name already registered");
    }

    let newCompany = await Company.create({
        owner: req.connectedUser.id,
        name: name,
    });

    let company = await newCompany.save();
    return company;
};

exports.newProfile = async (req, res, next) => {
    try {
        switch (req.body.kind) {
            case "Person":
                let newPerson = await registerPerson(req);
                logger.info(`Person ${newPerson.id} registered successfully`);

                return responseUtils.successResponse(res, req, 201, {
                    message: "Person registered successfully",
                    person: responseUtils.safeDatabaseData(newPerson),
                });
            case "Company":
                let newCompany = await registerCompany(req);
                logger.info(`Company ${newCompany.id} registered successfully`);

                return responseUtils.successResponse(res, req, 201, {
                    message: "Company registered successfully",
                    company: responseUtils.safeDatabaseData(newCompany),
                });
            default:
                responseUtils.errorResponse(req, errors.errors.BAD_BODY, "missing or bad kind");
                return;
        }
    } catch (error) {
        next(error);
    }
};

exports.getAccountProfiles = async (req, res, next) => {
    try {
        let persons = await Person.find({ owner: req.connectedUser.id })
            .select("-__v -owner -_id")
            .sort({ createdAt: -1 });
        let companies = await Company.find({ owner: req.connectedUser.id })
            .select("-__v -owner -_id")
            .sort({ createdAt: -1 });

        return responseUtils.successResponse(res, req, 200, {
            message: "Profiles fetched",
            persons: persons,
            companies: companies,
        });
    } catch (error) {
        next(error);
    }
};

// funny function name
exports.getProfileProfile = async (req, res, next) => {
    try {
        let person = await Person.findOne({ id: req.params.id });
        if (person) {
            return responseUtils.successResponse(res, req, 200, {
                message: "Person found",
                person: responseUtils.safeDatabaseData(person),
            });
        }

        let company = await Company.findOne({ id: req.params.id });
        if (company) {
            return responseUtils.successResponse(res, req, 200, {
                message: "Company found",
                company: responseUtils.safeDatabaseData(company),
            });
        }

        responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "profile not found");
    } catch (error) {
        next(error);
    }
};

exports.getProfileComments = async (req, res, next) => {
    try {
        let comments = await Comment.find({ author: req.params.id })
            .select("-__v -owner -_id")
            .sort({ createdAt: -1 });

        return responseUtils.successResponse(res, req, 200, {
            message: "Comments fetched",
            comments: comments,
        });
    } catch (error) {
        next(error);
    }
};

exports.getProfileArticles = async (req, res, next) => {
    try {
        let articles = await Article.find({ author: req.params.id })
            .select("-__v -owner -_id")
            .sort({ createdAt: -1 });

        return responseUtils.successResponse(res, req, 200, {
            message: "Articles fetched",
            articles: articles,
        });
    } catch (error) {
        next(error);
    }
};

const preProfileDelete = async (profilId) => {
    // delete all comments and articles
    await Comment.deleteMany({ author: profilId });
    await Article.deleteMany({ author: profilId });
};

exports.deleteProfile = async (req, res, next) => {
    try {
        let person = await Person.findOne({ id: req.params.id });
        if (person) {
            if (person.owner !== req.connectedUser.id) {
                responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "you are not the owner of this profile");
            }

            await preProfileDelete(person.id);
            await Person.deleteOne({ id: req.params.id });
            
            return responseUtils.successResponse(res, req, 200, {
                message: "Profile deleted",
            });
        }

        let company = await Company.findOne({ id: req.params.id });
        if (company) {
            if (company.owner !== req.connectedUser.id) {
                responseUtils.errorResponse(req, errors.errors.FORBIDDEN, "you are not the owner of this profile");
            }

            await preProfileDelete(company.id);
            await Company.deleteOne({ id: req.params.id });

            return responseUtils.successResponse(res, req, 200, {
                message: "Profile deleted",
            });
        }

        responseUtils.errorResponse(req, errors.errors.NOT_FOUND, "profile not found");
    } catch (error) {
        next(error);
    }
};