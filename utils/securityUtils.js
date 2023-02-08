const passwordValidator = require('password-validator');
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/vars");
const logger = require("../config/logger");
const errors = require('../config/errors');

const User = require("../models/userModels");


let schema = new passwordValidator();

schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits()                                 // Must have digits
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

exports.isPasswordValid = (password) => {
    return schema.validate(password);
};

const getConnectedUser = async (req) => {
    let token = req.headers.authorization;
    if (!token) {
        req.statusCode = errors.errors.UNAUTHORIZED.code;
        throw new Error(errors.errors.UNAUTHORIZED.message + " - missing token");
    };

    // decode token
    let decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
        req.statusCode = errors.errors.UNAUTHORIZED.code;
        throw new Error(errors.errors.UNAUTHORIZED.message + " - invalid token");
    }

    let now = new Date();
    if (now > decoded.expires) {
        req.statusCode = errors.errors.UNAUTHORIZED.code;
        throw new Error(errors.errors.UNAUTHORIZED.message + " - token expired");
    }
    
    let user = await User.findOne({ id: decoded.id }).select('-__v');

    if (!user) {
        req.statusCode = errors.errors.UNAUTHORIZED.code;
        throw new Error(errors.errors.UNAUTHORIZED.message + " - user with given token not found");
    }

    req.connectedUser = user;
};

exports.authorize = (roles = []) => async (req, res, next) => {
    try {
        await getConnectedUser(req);

        if (req.connectedUser.role === "banned") {
            req.statusCode = errors.errors.UNAUTHORIZED.code;
            throw new Error(errors.errors.UNAUTHORIZED.message);
        }
        
        if (req.connectedUser.role === "superadmin") {
            next();
        }

        if (roles.length >= 1 && !roles.includes(req.connectedUser.role)) {
            throw new Error(errors.errors.errors.errors.UNAUTHORIZED);
        }

        next();
    } catch (error) {
        next(error);
    }
};