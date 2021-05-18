const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const feedController = require("../controller/feedController");
const isAuth = require("../middleware/isAuth");

router.get("/posts", isAuth, feedController.getPosts);
router.post(
    "/post",
    isAuth,
    [body("title").trim().isLength({ min: 8 }), body("content").trim().isLength({ min: 5 })],
    feedController.addPost
);
router.get(
    "/post/:id",
    isAuth,
    [body("title").trim().isLength({ min: 8 }), body("content").trim().isLength({ min: 5 })],
    feedController.getPostById
);
router.put(
    "/post/:id",
    isAuth,
    [body("title").trim().isLength({ min: 8 }), body("content").trim().isLength({ min: 5 })],
    feedController.editPostById
);
router.delete("/post/:id", isAuth, feedController.deletePostById);

module.exports = router;
