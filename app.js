const express = require("express");
const bodyParser = require("body-parser");
const app = express();
// const feedRoutes = require("./routes/feed");
// const authRoutes = require("./routes/auth");
const auth = require("./middleware/isAuth");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const MONGOURI = require("./database/mongodbinfo");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images");
    },
    filename: (req, file, callback) => {
        callback(null, new Date().toISOString() + "_" + file.originalname);
    },
});
const fileFilter = (req, file, callback) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        return callback(null, true);
    } else {
        return callback(null, false);
    }
};

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
// app.use("/feed", feedRoutes);
// app.use("/auth", authRoutes);
app.use((error, req, res, next) => {
    console.log(error);
    res.status(error.statusCode || 500).json({ message: error.message, data: error.data });
});

app.use(auth);
app.put("/upload", (req, res, next) => {
    if (!req.isAuth) {
        throw new Error("Not logged in.");
    }
    if (!req.file) {
        return res.status(200).json({ message: "No file." });
    } else {
        if (req.body.oldPath) {
            removeImageFile(req.body.oldPath);
        }
        return res.status(200).json({ message: "Upload successful.", path: req.file.path });
    }
});
app.use(
    "/graphql",
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolvers,
        graphiql: true,
        customFormatErrorFn(err) {
            console.log(err.message);
            if (!err.originalError) {
                return err;
            } else {
                const data = err.originalError.data;
                const message = err.message || "Error.";
                const code = err.originalError.code || 500;
                return { message: message, status: code, data: data };
            }
        },
    })
);

mongoose
    .connect(MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((_) => {
        app.listen(8080);
    })
    .catch((e) => console.log("Database connection failed."));

const removeImageFile = (filePath) => {
    fs.unlink(path.join(__dirname, "..", filePath), (e) => (e ? console.log(e) : null));
};
