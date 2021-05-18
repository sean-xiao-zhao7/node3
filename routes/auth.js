const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const User = require("../models/User");
const body = require("express-validator").body;

router.put(
    "/register",
    body("email").custom((value, { req }) => {
        return User.findOne({ username: value }).then((user) => {
            if (user) {
                return Promise.reject("Username taken.");
            }
        });
    }),
    body("password").trim().isLength({ min: 6 }),
    body("name").trim().not().isEmpty(),
    authController.register
);

router.post("/login", authController.login);

module.exports = router;
