const jwt = require("jsonwebtoken");
const { jwtsecret } = require("../database/secrets");

module.exports = (req, res, next) => {
    const token = req.get("Authorization").split(" ")[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, jwtsecret);
    } catch (e) {
        e.statusCode = 500;
        throw e;
    }

    if (!decodedToken) {
        const e = new Error("Token not valid.");
        e.statusCode = 401;
        throw e;
    }
    req.userId = decodedToken.userId;
    next();
};
