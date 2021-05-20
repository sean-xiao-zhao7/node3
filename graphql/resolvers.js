const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const jwtsecret = require("../database/secrets").jwtsecret;

module.exports = {
    login: async function ({ username, password }, req) {
        // find existing user
        const user = await User.findOne({ username: username });

        // validate inputs
        let code;
        const errors = [];
        if (!validator.isEmail(username)) {
            errors.push({
                message: "Username is not an email.",
            });
            code = 422;
        }
        if (validator.isEmpty(password) || !validator.isLength(password, { min: 6 })) {
            errors.push({
                message: "Password must be minimum 6 characters.",
            });
            code = 422;
        }
        if (!user) {
            errors.push({
                message: "User not found.",
            });
            code = 404;
        } else {
            // verify password
            const passwordResult = await bcrypt.compare(password, user.password);
            if (!passwordResult) {
                errors.push({
                    message: "Wrong password.",
                });
                code = 401;
            }
        }
        if (errors.length > 0) {
            const error = new Error("Error.");
            error.data = errors;
            throw error;
        }

        // set JWT
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: username,
            },
            jwtsecret,
            {
                expiresIn: "1h",
            }
        );

        return { token: token, userId: user._id.toString() };
    },
    addUser: async function ({ userInput }, req) {
        // find existing user
        const user = await User.findOne({ username: userInput.username });

        // validate inputs
        const errors = [];
        if (!validator.isEmail(userInput.username)) {
            errors.push({
                message: "Username is not an email.",
            });
        }
        if (
            validator.isEmpty(userInput.password) ||
            !validator.isLength(userInput.password, { min: 6 })
        ) {
            errors.push({
                message: "Password must be minimum 6 characters.",
            });
        }
        if (errors.length > 0) {
            const error = new Error(errors.map((e) => e.message).toString());
            error.data = errors;
            error.code = 422;
            throw error;
        }

        // save to db
        if (!user) {
            const hashedPassword = await bcrypt.hash(userInput.password, 12);
            const newUser = new User({
                username: userInput.username,
                password: hashedPassword,
                name: userInput.name,
            });
            const savedUser = await newUser.save();
            return {
                ...savedUser._doc,
                _id: savedUser._id.toString(),
            };
        } else {
            const err = new Error("Username exists.");
            err.code = 422;
            throw err;
        }
    },
};
