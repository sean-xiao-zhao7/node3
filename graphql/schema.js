const { buildSchema } = require("graphql");

module.exports = buildSchema(`    
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        adder: User!
        createdAt: String!
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

    type loginResult {
        token: String!
        userId: String!
    }

    type getPostsResult {
        posts: [Post!]!
        totalPosts: Int
    }

    type RootQuery {
        login(username: String!, password: String!): loginResult!
        getPosts(page: Int): getPostsResult!
        getPost(id: String!): Post!
    }

    input AddPostInputData {
        title: String!
        content: String!
        imageUrl: String!       
    }

    type RootMutation {
        addUser(userInput: UserInputData): User!
        addPost(addPostInputData: AddPostInputData): Post!        
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
