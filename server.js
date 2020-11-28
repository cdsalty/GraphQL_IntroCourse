
const express = require('express');
const { graphqlHTTP } = require('express-graphql');

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    graphiql: true, // development tool to make queries to DEVELOPEMENT SERVER
  }),
);

app.listen(5000., () => console.log('Server is Running'))
