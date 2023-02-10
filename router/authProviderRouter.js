const express = require("express");
const router = express.Router();

router.use("/google", require("./googleRouter"));

module.exports = router;