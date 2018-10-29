const _ = require('lodash');
const ObjectModel = require('./dbSchema.js');
// const translate = require('../../helpers/translate.js');
// const updateTranslatable = require('../../helpers/updateTranslatable.js');
const pluralize = require('pluralize')


pluralize.addSingularRule(/news$/i, 'news')

const typeDefs = `
  extend type Query {
    getObjectModelById(id: ID!): ObjectModel
    getObjectModelByName(name: String!): ObjectModel
    getObjectModels(orderBy: ObjectModelOrderBy): [ObjectModel]
    
  }

  extend type Mutation {
    addObjectModel(name: String!, schemaDefinitionInputs: [SchemaDefinitionInput]): ObjectModel
    updateObjectModel(id: ID!, name: String!, schemaDefinitionInputs: [SchemaDefinitionInput]): ObjectModel
    deleteObjectModelById(id: ID!): ObjectModel
    
  }



  enum ObjectModelOrderBy {
    name_ASC
    name_DESC
    createdAt_ASC
    createdAt_DESC
    updatedAt_ASC
    updatedAt_DESC
  }


  
  type ObjectModelMeta {
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
  }

  type ObjectModel {
    id: ID!
    name: String!
    schemaDefinitions: [SchemaDefinition]
    meta: ObjectModelMeta
  }

  

`;


const resolvers = {
  Query: {
    getObjectModels: (root, args, context, info) => {

      const orderBy = _.isEmpty(args.orderBy) ? 'updatedAt_DESC' : args.orderBy;
      // console.log(">>>>>>", args, orderBy);
      let sort = {};



      switch (orderBy) {
        case 'name_ASC':
          sort = {
            name: 1
          };
          break;
        case 'name_DESC':
          sort = {
            name: -1
          };
          break;
        case 'createdAt_ASC':
          sort = {
            'meta.createdAt': 1
          };
          break;
        case 'createdAt_DESC':
          sort = {
            'meta.createdAt': -1
          };
          break;
        case 'updatedAt_ASC':
          sort = {
            'meta.updatedAt': 1
          };
          break;
        case 'updatedAt_DESC':
          sort = {
            'meta.updatedAt': -1
          };
          break;
      }

      return ObjectModel.find({ 'meta.deletedAt': { $exists: false } }, null, {
        sort
      }).then(
        (records) => {
          return records;
        }
      );
      
    },
    
    

    getObjectModelByName: (root, args, context, info) => {

      return ObjectModel.findOne({ name: args.name, 'meta.deletedAt': { $exists: false } }).then(
        (record) => {
          return record;
        }
      );
    },

    getObjectModelById: (root, args, context, info) => {

      return ObjectModel.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }).then(
        (record) => {
          return record;
        }
      );
    }

    
  },


  ObjectModel: {
    id: ({
      _id
    }) => typeof _id === 'string' ? _id : _id.toString(),
  },

  Mutation: {
    addObjectModel: (root, args, context, info) => {
      console.log('addObjectModel', args);
      let current = Date.now();

      

      

      return ObjectModel.findOne({ name: args.name, 'meta.deletedAt': { $exists: false } }).then((record) => {

        if (!_.isEmpty(record)) {
          throw(`ObjectModel with name ${args.name} already exists.`);
        }
      }).then(() => {
        return ObjectModel.create({
          
          name: pluralize.singular(args.name),
          meta: {
            createdAt: current,
            updatedAt: current
          },
          schemaDefinitions: args.schemaDefinitionInputs,
        })
      })
      .then((record) => {
          // console.log('record', record);
          
        return record;

      })

    },



    updateObjectModel: (root, args, context, info) => {
      console.log('updateObjectModel', args);
      let current = Date.now();

      



      return ObjectModel.findOne({ name: args.name, _id: { $ne: args.id } , 'meta.deletedAt': { $exists: false } }).then((record) => {

        if (!_.isEmpty(record)) {
          throw (`Name ${args.name} is already in use by another record.`);
        }
      }).then(() => {
        return ObjectModel.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
      }).then((record) => {
        
        return ObjectModel.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, {
          'meta.updatedAt': current,
          name: pluralize.singular(args.name),
          schemaDefinitions: args.schemaDefinitionInputs


        })
        }).then(() => {
          return ObjectModel.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
        })
        .then((record) => {
          // console.log('record', record);

          return record;

        })

    },




    deleteObjectModelById: (root, args, context, info) => {
      console.log('deleteObjectModelById', args);
      let current = Date.now();

      return ObjectModel.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, { 'meta.deletedAt': current }).then((result) => {
        
        return ObjectModel.findOne({ _id: args.id })


      })

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};