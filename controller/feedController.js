const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
    return res.status(200).json({
        posts: [
            {
                _id: 5,
                title: "First post",
                content: "First content",
                imageUrl: "images/aventador.jpg",
                adder: {
                    name: "Sean",
                },
                date: new Date(),
            },
        ],
    });
};

exports.addPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Validation failed.", errors: errors.array() });
    }

    const newPost = new Post({
        title: req.body.title,
        content: req.body.content,
        imageUrl: "images/aventador.jpg",
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
        .catch((e) => console.log(e));
};
