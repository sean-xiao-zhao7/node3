const { validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtsecret = require("../database/secrets").jwtsecret;
// const fs = require("fs");
// const path = require("path");

exports.register = (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        const error = new Error("Invalid registration input.");
        error.statusCode = 422;
        error.data = validationResult(req).array();
        throw error;
    }

    bcrypt
        .hash(req.body.password, 12)
        .then((result) => {
            const user = new User({
                username: req.body.username,
                password: result,
                name: req.body.name,
            });
            return user.save();
        })
        .then((user) => {
            return res.status(201).json({ message: "User registered.", id: user._id });
        })
        .catch((e) => {
            console.log(e);
            next(e);
        });
};

exports.login = (req, res, next) => {
    User.findOne({ username: req.body.username })
        .then((user) => {
            if (!user) {
                const error = new Error("No user found with username " + req.body.username);
                error.statusCode = 401;
                throw error;
            }

            bcrypt
                .compare(req.body.password, user.password)
                .then((result) => {
                    if (!result) {
                        const error = new Error("Wrong password");
                        error.statusCode = 401;
                        throw error;
                    }

                    return res.status(200).json({
                        token: jwt.sign(
                            { username: user.username, userId: user._id.toString() },
                            jwtsecret,
                            {
                                expiresIn: "1h",
                            }
                        ),
                        userId: user._id.toString(),
                    });
                })
                .catch((e) => {
                    if (!e.statusCode) {
                        e.statusCode = 500;
                    }
                    next(e);
                });
        })
        .catch((e) => next(e));
};
