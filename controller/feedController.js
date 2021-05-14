const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
    Post.find()
        .then((posts) => {
            return res.status(200).json({
                posts: posts,
            });
        })
        .catch((e) => next(e));
};

exports.addPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed.");
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        throw new Error({
            message: "No image uploaded.",
            statusCode: 422,
        });
    }

    const newPost = new Post({
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.file.path,
        adder: {
            name: "Sean",
        },
    });
    newPost
        .save()
        .then((_) => {
            return res.status(201).json({
                message: "Add post successful.",
                post: newPost,
            });
        })
        .catch((e) => {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(err);
        });
};

exports.getPostById = (req, res, next) => {
    Post.findById(req.params.id)
        .then((post) => {
            if (!post) {
                throw new Error({
                    message: "No post found by id " + req.params.id,
                    statusCode: 404,
                });
            }
            return res.json({ post: post });
        })
        .catch((e) => next(e));
};
