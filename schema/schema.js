const graphql = require('graphql');
// const _ = require('lodash');  // helper function to work with collections of data.
const axios = require('axios');


const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema // takes the RootQuery and returns an Graph schema instance
} = graphql;

// Order of definition matters, CompanyType must come first
const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString }
  }
})

// a UserType represents a "user"; every user will have an id, firstName, age, etc. 
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        console.log(parentValue, args); //  { id: '40', firstName: 'Alex', age: 30, companyId: '2' }
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  }
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: { // provides access to the users info; specifically, a user id, it will return that user
      type: UserType,
      args: { id: { type: GraphQLString } }, // args is requiring an id
      resolve(parentValue, args) {  // args is whatever is passed in the original inquiry.
        // return _.find(users, { id: args.id }); // lodash function (go through users, find id equal to the id when the query is made)
        // The following is now coming from jason-server
        return axios.get(`http://localhost:3000/users/${args.id}`)
          .then(res => res.data); // axios and graphql querk ?
      }
    },
    // Adding the company as a sibling
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },  // arguement expected to be passed in, id
      // make the action happen with resolve; create ability to search only companies.
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${args.id}`)
          .then(res => res.data);
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
  - name & fields is required; fields most important
  - name will always be a string that defines the type
  - feilds tells graphQL all of the properties a user has.
    - the keys are the names of the properties the User has
    - the fields instruct graphql that every *user/etc* will have these
      --> all fields must have a type and each type must be imported

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
                    --> http://localhost:3000/users


Remember, RESOLVE must return the data that represents a user object
  - need to make it more asynchonrous by using promises... the request will be made to express and then express will ask/check graphql; if yes, it will return the RESPONSE
    --> inside the resolve function, make an HTTP request inside of the resolve function and return the promise.
    -- npm install --save axios
    - removed lodash and the users data

    return to http://localhost:5000/graphql
    QUERY:
      {
        user(id: "40") {
          firstName
        }
      }
          -> now returning data from the database of json:server

- Resolve is a playground for fetching data any piece of data


--------------------

Next: Relating company with a user
http://localhost:3000/companies/2/users
- this is all based on the id set in the args that created the relationship.

After adding companyType, need to consider the relationships...
- Treat associations between types to get an association between companyType and the userType
--> To create a link between company and user types, go inside the USERTYPE and add a company field of CompanyType. This creates the link/relationship.
      - company: { type: CompanyType }

THE NEXT PART: How to take a user, such as user with ID 23 and find their associated company. Tell graphQL how to walk between the two

company: {
      type: CompanyType,
      resolve(parentValue, args) {
        console.log(parentValue, args); //  { id: '40', firstName: 'Alex', age: 30, companyId: '2' }
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }

    and this now allows you pull this api data point from graphiql


____________________________________________________________________________________________________________________________________
Currently, the way it's setup, I am unable to retrieve the company(ies); This is due to the root query pointing directly to Users and then
the User will point to a company. No ability to go directly to a company.

How to go to a company directly?
    --> By adding on another field to the root query type called 'company'
      - the 'company' will be a sibling to user
      - the setup will somewhat mimic the data from getting the UserType.




*/
