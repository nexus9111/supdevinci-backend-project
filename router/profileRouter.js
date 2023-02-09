const express = require("express");
const router = express.Router();

const securityUtils = require("../utils/securityUtils");

const profileController = require("../controllers/profileController");

router.post("/", profileController.newProfile);
router.get("/", profileController.getAccountProfiles);
router.get("/:id", profileController.getProfileProfile);
router.get("/:id/comments", profileController.getProfileComments);
router.get("/:id/articles", profileController.getProfileArticles);
router.delete("/:id", profileController.deleteProfile);

module.exports = router;