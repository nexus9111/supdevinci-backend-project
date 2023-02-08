const express = require("express");
const router = express.Router();

const securityUtils = require("../utils/securityUtils");

const controller = require("../controllers/authController");

router.post("/login", controller.login);
router.post("/register", controller.register);

// you can use this to protect your route
router.get("/profile", securityUtils.authorize([]), controller.profile);
router.delete("/:id", securityUtils.authorize([]), controller.deleteProfile);

module.exports = router;