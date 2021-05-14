exports.getPosts = (req, res, next) => {
    return res.status(200).json({ posts: [{ title: "First post", content: "First content" }] });
};

exports.addPost = (req, res, next) => {
    res.status(201).json({
        message: "Add done.",
        post: {
            id: new Date().toISOString(),
            title: req.body.title,
            content: req.body.content,
        },
    });
};
