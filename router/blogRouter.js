const express = require('express');
const router = express.Router();

const securityUtils = require("../utils/securityUtils");

const controller = require('../controllers/blogController');

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);

router.post('/', securityUtils.authorize([]), controller.create);
router.put('/:id', securityUtils.authorize([]), controller.update);
router.delete('/:id', securityUtils.authorize([]), controller.delete);

module.exports = router;