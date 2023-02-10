const express = require("express");
const router = express.Router();
const passport = require("passport");

const authController = require("../controllers/authController");
const errors = require("../config/errors");

router.get("/", passport.authenticate("google", {
    scope: ["profile", "email"],
}));

router.get("/callback",
    passport.authenticate("google", {
        failureRedirect: "/auth-provider/google/callback/failure",
        successRedirect: "/auth-provider/google/callback/success",
    }),
);

router.get("/callback/success", (req, res, next) => {
    if (!req.user) {
        return res.redirect("/auth-provider/google/callback/failure");
    }

    req.provider = "google";
    return authController.providerAuth(req, res, next);
});

router.get("/callback/failure", (req, res, next) => {
    req.statusCode = errors.errors.ERROR_PROVIDER_AUTH.code;
    next(new Error(errors.errors.ERROR_PROVIDER_AUTH.message));
});

module.exports = router;