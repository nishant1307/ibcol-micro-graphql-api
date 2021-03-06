const port = process.env.PORT === undefined ? 3000 : process.env.PORT;

// if (process.env.NODE_ENV !== 'production') {
//   require('now-env')
// }
// require('custom-env').env(true);
if (process.env.NODE_ENV !== 'production') {
  require('now-env')
}

const { makeExecutableSchema } = require('graphql-tools');
const { merge } = require ('lodash');

const { withNamespace, router, get, post, put, patch, del, head, options } = require('microrouter');
const cors = require('micro-cors')();
const { ApolloServer } = require('apollo-server');

// const { GraphQLScalarType } = require('graphql');

// const api = withNamespace('/v1');


const chalk = require('chalk');


const notfoundHandler = require('./handlers/notfoundHandler');
// const mailchimpSubscribeHandler = require('./handlers/mailchimpSubscribeHandler');
// const mailchimpInfoHandler = require('./handlers/mailchimpInfoHandler');






const AccountsPassword = require('@accounts/password').default;
const AccountsServer = require('@accounts/server').default;
const MongoDBInterface = require('@accounts/mongo').default;

const mongoose = require('mongoose');

console.log('mongoose:', chalk.blue('connecting to MongoDB...'));
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
console.log('mongoose:', chalk.green('connection established.'));
console.log("======================");
console.log(process.env);
console.log("======================");
const connection = mongoose.connection;



// connection.on('open', function () {
//   connection.db.listCollections().toArray(function (err, names) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(names);
//     }

//     // mongoose.connection.close();
//   });
// });





const password = new AccountsPassword();

const accountsServer = new AccountsServer(
  {
    db: new MongoDBInterface(connection),
    tokenSecret: '#!@dc8f898c-0b78-435e-b131-76940f99a335@@',
  },
  {
    password,
  }
);

const { createAccountsGraphQL } = require('@accounts/graphql-api');

const accountsGraphQL = createAccountsGraphQL(accountsServer);

const registerMutation = accountsGraphQL.resolvers.Mutation.register;

// console.log('accountsGraphQL', accountsGraphQL);



// const { typeDefs, resolvers } = require('./graphql');



// const {
//   typeDef as translatable
// } = require('graphqlSchema/Translatable');

const _Date = require('./graphqlSchema/Date');
// const Translatable = require('./graphqlSchema/Translatable');
// const SchemaDefinition = require('./graphqlSchema/SchemaDefinition');
// const Field = require('./graphqlSchema/Field');
// const Page = require('./graphqlSchema/Page');
// const Component = require('./graphqlSchema/Component');
// const ObjectModel = require('./graphqlSchema/ObjectModel');
// const CustomObject = require('./graphqlSchema/CustomObject');
const Application = require('./graphqlSchema/Application');
const AdminEmail = require('./graphqlSchema/AdminEmail');
const AccessToken = require('./graphqlSchema/AccessToken');
const _JSON = require('./graphqlSchema/JSON');


const Query = `

  type Query {
    _empty: String
    queryTest: String
  }

`;

const Mutation = `
  type Mutation {
    _empty: String
    
  }
`;




let Resolvers = {
  Query: {
    queryTest: () => 'Query link establised.',
  },
  Mutation: {
    

    register: async (...args) => {
      const userId = await registerMutation(...args);
      return userId.toString();
    },
  },
  User: {
    id: ({ _id }) => typeof _id === 'string' ? _id : _id.toString()
  },
  LoginResult: {
    sessionId: ({ sessionId }) => sessionId.toString(),
  },
};

const schema = makeExecutableSchema({
  
  typeDefs: [
    accountsGraphQL.typeDefs,
    _Date.typeDefs,
    _JSON.typeDefs,
    // Translatable.typeDefs,
    // SchemaDefinition.typeDefs,
    // Field.typeDefs,
    // Page.typeDefs,
    // Component.typeDefs,
    // ObjectModel.typeDefs,
    // CustomObject.typeDefs,
    Application.typeDefs,
    AdminEmail.typeDefs,
    AccessToken.typeDefs,

    Query,
    Mutation
  ],


  resolvers: merge(
    accountsGraphQL.resolvers,
    _Date.resolvers,
    _JSON.resolvers,
    // Field.resolvers,
    // Page.resolvers,
    // Component.resolvers,
    // ObjectModel.resolvers,
    // Translatable.resolvers,
    // CustomObject.resolvers,
    Application.resolvers,
    AdminEmail.resolvers,
    AccessToken.resolvers,
    


    Resolvers,
  ),

  
});







const graphqlPath = '/graphql';

const apolloServer = new ApolloServer({
  schema,
  subscriptionsPath: graphqlPath,

  // engine: {
  //   apiKey: "YOUR API KEY HERE"
  // }

  context: ({ req }) => {

    const token = req.headers.token || '';
    const email = req.headers.email || '';
    
    
    
    return { accessToken: {token, email} };
  },

  playground: (process.env.NODE_ENV === 'production') ? false : {
    settings: {
      'editor.theme': 'dark',
      'editor.cursorShape': 'line' // possible values: 'line', 'block', 'underline'
    }
  }
});




apolloServer.listen({ port }).then(({ url }) => {
  
  console.log(`🚀 Server ready at ${url}`)
})