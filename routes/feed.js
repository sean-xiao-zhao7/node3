const express = require("express");
const router = express.Router();
const feedController = require("../controller/feedController");

router.get("/posts", feedController.getPosts);
router.post("/post", feedController.addPost);

module.exports = router;
