const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const jwtsecret = require("../database/secrets").jwtsecret;

module.exports = {
    getPost: async function ({ id }, req) {
        // auth check
        if (!req.isAuth) {
            const e = new Error("Not logged in.");
            e.code = 401;
            throw e;
        }

        const post = await Post.findById(id).populate("adder");

        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
        };
    },
    getPosts: async function ({ page }, req) {
        try {
            //pagination
            const perPage = 2;
            const currentPage = page || 1;

            const totalPosts = await Post.find().countDocuments();
            const posts = await Post.find({ adder: req.userId })
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
                .populate("adder");
            return {
                posts: posts.map((p) => {
                    return {
                        ...p._doc,
                        id: p._id.toString(),
                        createdAt: p.createdAt.toISOString(),
                        updatedAt: p.updatedAt.toISOString(),
                    };
                }),
                totalPosts: totalPosts,
            };
        } catch (e) {
            const error = new Error(e.message);
            error.code = 500;
            throw error;
        }
    },
    addPost: async function ({ postInputData }, req) {
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
            validator.isEmpty(postInputData.title) ||
            validator.isEmpty(postInputData.content) ||
            validator.isEmpty(postInputData.imageUrl)
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
            title: postInputData.title,
            content: postInputData.content,
            imageUrl: postInputData.imageUrl,
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
    updatePost: async function ({ postInputData }, req) {
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
            validator.isEmpty(postInputData.title) ||
            validator.isEmpty(postInputData.content) ||
            validator.isEmpty(postInputData.imageUrl)
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
        try {
            const newPost = await Post.findById(postInputData._id);
            newPost.title = postInputData.title;
            newPost.content = postInputData.content;
            newPost.imageUrl = postInputData.imageUrl;
            newPost.adder = user;
            const result = await newPost.save();

            return {
                ...result._doc,
                _id: result._id.toString(),
                createdAt: result.createdAt.toISOString(),
                updatedAt: result.updatedAt.toISOString(),
            };
        } catch (err) {
            console.log(err);
        }
    },
    deletePost: async function ({ id }, req) {
        const post = await Post.findById(id);
        if (!post) {
            throw new Error("Post not found for id " + id);
        }
        try {
            await post.remove();
            return {
                _id: id,
            };
        } catch (err) {
            const error = new Error("Could not delete post " + id);
            error.code = 500;
            error.data = err;
            throw error;
        }
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
