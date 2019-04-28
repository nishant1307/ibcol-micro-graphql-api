const _ = require('lodash-checkit');
const AdminEmail = require('./dbSchema.js');
const AccessToken = require('../AccessToken/dbSchema.js');

const {isTokenValid} = require('../../helpers/auth.js');



const typeDefs = `
  extend type Query {
    isAdminTokenValid(email: String!, token: String!): Boolean
  }

  extend type Mutation {
    addAdminEmail(email: String!, accessToken: TokenInput!): String

  }

  type AdminEmail {
    id: ID!
    email: String!
    meta: AdminEmailMeta
  }
  
  type AdminEmailMeta {
    createdAt: Date
    updatedAt: Date
    approvedAt: Date
    rejectedAt: Date
    deletedAt: Date
  }

`;




const resolvers = {
  Query: {
    isAdminTokenValid: async (root, args, context, info) => {
      console.log('isAdminTokenValid', args);
      return await isTokenValid(args.email.trim(), args.token.trim());
    },
    

    
  },


  AdminEmail: {
    id: ({
      _id
    }) => typeof _id === 'string' ? _id : _id.toString(),
    // title: (page, args, context, info) => {
    //   console.log('args', args);
    //   console.log('context', context);
    //   console.log('info', info);
    //   console.log('page', page);
      
    //   return page.title;

    // }
  },

  Mutation: {
    addAdminEmail: async (root, args, context, info) => {
      console.log('addAdminEmail', args);

      let current = Date.now();

      if (!await isTokenValid(args.accessToken, true)) {
        throw('Invalid admin token.');
      }
      
      const email = args.email.trim();

      if (!_.isEmail(email)) {
        throw('The email address is invalid.');
      }

      const existingAdminEmail = await AdminEmail.find({
        email: email.toLowerCase(),
        deletedAt: {
          $exists: false
        }
      });


      if (existingAdminEmail.length > 0) {
        throw(`${email} is already an admin.`);
      }

      const adminEmail = await AdminEmail.create({
        meta: {
          createdAt: current,
          updatedAt: current
        },
        email
      });

      
      return adminEmail.email;

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};