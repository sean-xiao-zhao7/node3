const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");

module.exports = {
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
