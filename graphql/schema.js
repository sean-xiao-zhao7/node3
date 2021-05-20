const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        adder: User!
        createAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        username: String!
        password: String        
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        username: String!
        password: String!
        name: String!
    }

    type RootQuery {
        hello: String
    }

    type RootMutation {
        addUser(userInput: UserInputData): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
