const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const feedRoutes = require("./routes/feed");
const MONGOURI = require("./database/mongodbinfo");
const mongoose = require("mongoose");

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
app.use("/feed", feedRoutes);
mongoose
    .connect(MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((_) => {
        app.listen(8080);
    })
    .catch((e) => console.log("Database connection failed."));
