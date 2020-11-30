const graphql = require('graphql');
const _ = require('lodash');  // helper function to work with collections of data.


const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema
} = graphql;


const users = [
  { id: '23', firstName: 'Bill', age: 20 },
  { id: '47', firstName: 'Samantha', age: 21 }
];

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt }
  }
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } }, // args takes id which is passed to return a user type
      resolve(parentValue, args) {
        return _.find(users, { id: args.id }); // lodash function (go through users, find id equal to the id when the query is made)
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery
})


/*
The Goal of the Schema file is to tell GraphQL what type of data in the application and how it's related.

GraphQLObjectType: used to instruct GraphQL about the presence/idea of a USER

UserType: defines the properties of the user...
  - name & fields is required; fields very important
  - name will always be a string that defines the type
  - feilds tells graphQL all of the properties a user has.
    - the keys are the names of the properties the User has
    - all fields must have a type and each type must be imported

resolve (most important) is the function that goes inside the database to retrieve the data
parentValue (not used as much and not discussed yet...)
args is an object that is called with the arguments that were passed into the original query. (id will be present for this args)

The two types, the UserType and the RootQuery, merge together into a GraphQL schema object and hand back to graphQL middleware inside server.js
  - import GraphQLSchema which takes in a RootQuery and returns a graphQL schema instance


  **
  Using Data:
  https://github.com/typicode/json-server
  - npm install --save json-server
  - create db.json
  - must be started seperatly, outside my users app in order to mock using mulitple databases
    --> add another script under "scripts"
        --> "json:server": "json-server --watch db.json"
          - open seperate terminal, npm run json:server (make sure to test link...)

*/