const express = require('express');
const router = express.Router();

const securityUtils = require("../utils/securityUtils");

const controller = require('../controllers/blogController');

router.get('/comments/:id', controller.getComment);
router.post('/comments/:id', securityUtils.authorize([]), controller.comment);
router.delete('/comments/:id', securityUtils.authorize([]), controller.deleteComment);

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', securityUtils.authorize([]), controller.create);
router.put('/:id', securityUtils.authorize([]), controller.update);
router.delete('/:id', securityUtils.authorize([]), controller.delete);

module.exports = router;