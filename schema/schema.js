const graphql = require('graphql');
// const _ = require('lodash');  // helper function to work with collections of data.
const axios = require('axios');

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema // takes the RootQuery and returns an Graph schema instance
} = graphql;

// Order of definition matters, CompanyType must come first
const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({  // now this function will get defined but not executed until the entire file has been excecuted. Internally, graphql will know to resolve the other types to correctly define it; it's a work around on graphql (Closures 101)
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),  // informing graphql to expect a list of users
      // don't need an argument; just getting back a list of names based from the company that's been provided/entered; 
      resolve(parentValue, args) {  // to get a reference to the companies, log out the parentValue
        return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then(res => res.data);
      }
    }
  })
})

// a UserType       represents a "user"; every user will have an id, firstName, age, etc. 
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({ // anonymous function to prevent order of operations error
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        // console.log(parentValue, args); //  { id: '40', firstName: 'Alex', age: 30, companyId: '2' }
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  })
})



const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    // user
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

// MUTATION(s)
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // ADD A USER
    addUser: {
      type: UserType, // the type here must reflect the type of data you expect back after the resolve function is ran. Sometimes the data and the type won't be the same.
      args: { // args will be the data you expect to be given / the function goal such as, addUser   
        firstName: { type: new GraphQLNonNull(GraphQLString) }, // to require this property, use GraphQLNonNull
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      // resolve(parentValue, args) {  //  <-----> args is made up of firstName, age, companyId so be user to destructure 
      resolve(parentValue, { firstName, age }) {
        return axios.post('http://localhost:3000/users', { firstName, age })  // when it responds, it will respond with the details on the server's side
          .then((res) => res.data);
      }
    }
  }

});



module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: mutation
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

          company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } },  // arguement expected to be passed in, id
            // make the action happen with resolve; create ability to search only companies.
            resolve(parentValue, args) {
              return axios.get(`http://localhost:3000/companies/${args.id}`)
                .then(res => res.data);
          }
        }

    - now have a problem that is opposite as before... if we seach in company for a users 'firstname', we get an error
          --> WHY? You can't query a field of 'users' on a type 'Company'
          - Turns out, this definition to create this relationship hasn't been established

    CURRENT SETUP

        RootQuery: - user and to company
          - user can go to company
          - company can't go to user.

    - EVERY COMPANY WILL HAVE MULTIPLE USERS
        - the goal is to create the functionality that we can go through company and pull out mulitple/list of Users
          - ONE: check out the json:server and determine how to get the list of users given in a company id.
                - localhost3000/companies/1/users is the test route
                - localhost3000/companies/2/users
                --> now that you know to get a list of users who are associated with the company from json:server, need to update the schema file to teach
                    the companyType how to go from a company over to a list of users
          - TWO: (inside the companyType)
            - add a new key, 'users' and set it to be an object
              - users: {

              }


              How to deal with type new GraphQLList(UserType) which is an issue caused because UserType hasn't been declared yet. To get around
              this, go inisde companytype and set fields equal to an anoyomous function
              -> used to prevent an order of operations error it will render otherwise
              fields: () => ({
                id: { type: GraphQLString },
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                users: {
                  type: new GraphQLList(UserType),  // this variable is assigned in the UserType
                  resolve(parentValue, args) {  // to get a reference to the companies, log out the parentValue
                    console.log("Company logging details of users through parentValue:" + parentValue) // add the parentValue inside the url to get users
                    return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                      .then(res => res.data);
                  }
                }
              })

    Graphiql:
      company(id: "1"){
        name
        id
        description
        users {
          firstName
        }
      }
    }
also: really go far out:
{
  company(id: "1"){
    name
    id
    description
    users {
      firstName
      age
      company {
        name
        users {
          firstName
        }
      }
    }
  }
}


____________________________________________________________________________________________________

Syntax with Query Fragments
- allows you to name a graphiql query; has more uses on the front-end.
query findCompany{
  company(id: "1"){
    id
  }
}
- the opening brackets of graphiql should be thought of as the overall query is being sent to the 'root-query type'.
  ->  {
        comapany(id: "1"){  <--- on the root-query type, we are asking for something from the company or user depending on the query

        }
      }

  - to get multiple results from one query such as company, you must lable/name the company field
        -> {
            comapany(id: "1"){  <--- won't work
            // THE SOLUTION
            apple: company(id: "1") {

            }
            banana: company(id: "2")
            }
          }

  * Query Fragments: a list of different properties that you want access too. Also helps make the code DRY
  fragment companyDetails on Company {
    id
    name
    description
  }
  *** AND THEN, REPLACE THE DATA IN GRAPHIQL WITH ' ...COMPANYDETAILS '
  --> {
        apple:company(id: "1"){
          ...companyDetails       <--------------- query fragments
        }
        google:company(id: "2"){
          ...companyDetails       <--------------- query fragments
        }
      }

25. MUTATIONS
    - inside args, to require a field of text to be entered, use: firstName: { type: new GraphQLNonNull(GraphQLString) } as example
    - export mutation at bottom
    - in the docs panel of graphQL, you should see Mutation with the schema created. (the ' ! ' means it is requred)

  * when using mutations,you must ask for some properties coming back form it, such as the id, firstName, age... What comes back is WHAT WAS R E S O L V E D when it is created *
    - to write a mutation in graphQL, include 'mutation'
      -> mutation {
          addUser(firstName: "Daisy", age: 26){

          }
        }

mutation {
  addUser(firstName:"Jennifer", age:26) {
    id
    firstName
    age
  }
}

followed by...
{
  "data": {
    "addUser": {
      "id": "paGQpNN",
      "firstName": "Jennifer",
      "age": 26
    }
  }
}

*/
