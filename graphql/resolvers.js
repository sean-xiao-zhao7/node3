const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const jwtsecret = require("../database/secrets").jwtsecret;

module.exports = {
    getPosts: async function ({}, req) {
        try {
            const posts = await Post.find({ adder: req.userId })
                .sort({ createdAt: -1 })
                .populate("adder");
            return posts.map((p) => {
                    return {
                        ...p._doc,
                        id: p._id.toString(),
                        createdAt: p.createdAt.toISOString(),
                        updatedAt: p.updatedAt.toISOString(),
                    };
                })            
        } catch (e) {
            const error = new Error(e.message);
            error.code = 500;
            throw error;
        }
    },
    addPost: async function ({ addPostInputData }, req) {
        // find existing user
        if (!req.isAuth) {
            const e = new Error("Not logged in.");
            e.code = 401;
            throw e;
        }
        const user = await User.findById(req.userId);

        // validate inputs
        let code;
        const errors = [];
        if (
            validator.isEmpty(addPostInputData.title) ||
            validator.isEmpty(addPostInputData.content) ||
            validator.isEmpty(addPostInputData.imageUrl)
        ) {
            errors.push({
                message: "Post info not complete.",
            });
            code = 422;
        }
        if (!user) {
            errors.push({
                message: "User not found.",
            });
            code = 401;
        }
        if (errors.length > 0) {
            const error = new Error("Error.");
            error.data = errors;
            error.code = code;
            throw error;
        }
        const newPost = new Post({
            title: addPostInputData.title,
            content: addPostInputData.content,
            imageUrl: addPostInputData.imageUrl,
            adder: user,
        });
        const result = await newPost.save();
        user.posts.push(result);
        await user.save();

        return {
            ...result._doc,
            _id: result._id.toString(),
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
        };
    },
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
