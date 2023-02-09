const express = require("express");
const router = express.Router();

const securityUtils = require("../utils/securityUtils");

const controller = require("../controllers/authController");

router.post("/login", securityUtils.checkBody, controller.login);
router.post("/register", securityUtils.checkBody, controller.register);

// you can use this to protect your route
router.get("/", securityUtils.authenticate, controller.profile);
router.delete("/", securityUtils.authenticate, controller.deleteProfile);

module.exports = router;