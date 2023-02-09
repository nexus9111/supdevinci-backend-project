const express = require("express");
const router = express.Router();

const securityUtils = require("../utils/securityUtils");

const controller = require("../controllers/blogController");

// no need to be authenticated
router.get("/:id/comments", controller.getCommentsFromArticle);
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);

// need to be authenticated
router.post("/:id/comments", [securityUtils.authenticate, securityUtils.authenticateProfile], controller.comment);
router.delete("/comments/:id", [securityUtils.authenticate, securityUtils.authenticateProfile], controller.deleteComment);
router.post("/", [securityUtils.authenticate, securityUtils.authenticateProfile], controller.create);
router.put("/:id", [securityUtils.authenticate, securityUtils.authenticateProfile], controller.update);
router.delete("/:id", [securityUtils.authenticate, securityUtils.authenticateProfile], controller.delete);

module.exports = router;