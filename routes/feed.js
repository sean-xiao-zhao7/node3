const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const feedController = require("../controller/feedController");

router.get("/posts", feedController.getPosts);
router.post(
    "/post",
    [body("title").trim().isLength({ min: 8 }), body("content").trim().isLength({ min: 5 })],
    feedController.addPost
);
router.get('/post/:id', feedController.getPostById);

module.exports = router;
