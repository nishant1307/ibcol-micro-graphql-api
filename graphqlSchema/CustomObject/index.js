const _ = require('lodash');
const CustomObject = require('./dbSchema.js');
const ObjectModel = require('../ObjectModel/dbSchema.js');
const translate = require('../../helpers/translate.js');
const updateTranslatable = require('../../helpers/updateTranslatable.js');



const typeDefs = `
  extend type Query {
    getCustomObjectById(id: ID!, locale: String): CustomObject
    getCustomObjectsByModel(model: String!, locale: String, orderBy: CustomObjectOrderBy, sortByJSONString: String, limit: Int, search: String): [CustomObject]
    
  }

  extend type Mutation {
    addCustomObject(model: String!, label: String!, customOrder: Int, locale: String!, localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): CustomObject
    updateCustomObject(id: ID!, label: String!, customOrder: Int, locale: String!, localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): CustomObject
    deleteCustomObjectById(id: ID!): CustomObject
    
  }



  enum CustomObjectOrderBy {
    label_ASC
    label_DESC
    createdAt_ASC
    createdAt_DESC
    updatedAt_ASC
    updatedAt_DESC
    customOrder_ASC
    customOrder_DESC
  }

  

  

  

  type LocalisedCustomObject {
    locale: String!
    fields: [LocalisedField]
  }

  
  type CustomObjectMeta {
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
  }

  type CustomObject {
    id: ID!
    customOrder: Int
    model: String!
    localisedContent: LocalisedCustomObject
    label: String!
    fields: [Field]
    unlocalisedFields: [UnlocalisedField]
    meta: CustomObjectMeta
  }

  

`;


const translateRecord = (record, locale) => {

  return Object.assign({}, record, {
    localisedContent: {
      locale: locale,
      fields: record.fields.map((field) => {
        return Object.assign({}, field, {
          value: translate(field.value, locale)
        })
      })
    }
  });
}



const resolvers = {
  Query: {
    getCustomObjectsByModel: (root, args, context, info) => {

      const orderBy = _.isEmpty(args.orderBy) ? 'customOrder_ASC' : args.orderBy;
      // console.log(">>>>>>", args, orderBy);
      let sort = {};

      const limit = _.isEmpty(args.limit) ? undefined : args.limit;

      switch (orderBy) {
        case 'label_ASC':
          sort = {
            label: 1
          };
          break;
        case 'label_DESC':
          sort = {
            label: -1
          };
          break;
        case 'customOrder_ASC':
          sort = {
            customOrder: 1
          };
          break;
        case 'customOrder_DESC':
          sort = {
            customOrder: -1
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

      return CustomObject.find({ 'model': args.model, 'meta.deletedAt': { $exists: false } }, null, {
        sort, limit
      }).then(
        (records) => {
          if (args.locale !== undefined) {


            let translatedRecords = records.map((record) => {
              return translateRecord(record.toObject(), args.locale)
            })

            

            return translatedRecords;
          } else {
            return records;
          }
        }
      );
      
    },
    

    getCustomObjectById: (root, args, context, info) => {

      return CustomObject.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }).then(
        (record) => {
          if (args.locale !== undefined) {


            return translateRecord(record.toObject(), args.locale);
          } else {
            return record;
          }
        }
      );
    }

    
  },


  CustomObject: {
    id: ({
      _id
    }) => typeof _id === 'string' ? _id : _id.toString(),
  },

  Mutation: {
    addCustomObject: (root, args, context, info) => {
      console.log('addCustomObject', args);
      let current = Date.now();

      let fields = [];
      let unlocalisedFields = [];

      if (!_.isEmpty(args.localisedFieldInputs)) {
        args.localisedFieldInputs.map((localisedField) => {
          fields.push({
            key: localisedField.key,
            value: [
              {
                locale: args.locale,
                translation: localisedField.value
              }
            ]
          })
        });
      }

      if (!_.isEmpty(args.unlocalisedFieldInputs)) {
        args.unlocalisedFieldInputs.map((unlocalisedField) => {
          unlocalisedFields.push({
            key: unlocalisedField.key,
            value: unlocalisedField.value
          })
        });
      }

      

      return CustomObject.create({
          model: args.model,
          label: args.label,
          customOrder: args.customOrder === undefined ? 0 : args.customOrder,
          meta: {
            createdAt: current,
            updatedAt: current
          },
          fields,
          unlocalisedFields
      }).then((record) => {
          // console.log('record', record);
          
        return translateRecord(record.toObject(), args.locale);

        }
      )

    },



    updateCustomObject: (root, args, context, info) => {
      console.log('updateCustomObject', args);
      let current = Date.now();

      // let fields = [];

      // if (!_.isEmpty(args.localisedFieldInputs)) {
      //   args.localisedFieldInputs.map((localisedField) => {
      //     fields.push({
      //       key: localisedField.key,
      //       value: [
      //         {
      //           locale: args.locale,
      //           translation: localisedField.value
      //         }
      //       ]
      //     })
      //   });
      // }
      let getCustomObject = CustomObject.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
      let getCustomObjectModel = getCustomObject.then((record)=>{
        console.log('record >>> ', record.model);
        return ObjectModel.findOne({ name: record.model, 'meta.deletedAt': { $exists: false } });
      })
      

      return Promise.all([getCustomObject, getCustomObjectModel]).then(([record, customObjectModel]) => {
        
        const schemaDefinitions = customObjectModel.schemaDefinitions;

        
        
        
        let updatedFields = [];
        let updatedUnlocalisedFields = [];

        

        if (!_.isEmpty(schemaDefinitions)) {
          
          updatedFields = record.fields.filter((field)=>{
            const def = _.find(schemaDefinitions, { "key": field.key });
            // console.log('def', def);
            if (def === undefined) {
              return false;
            }
            return def.unlocalised !== true;
          }).map((field) => {
            // clean up __typename
            // field.__typename = undefined;
            return field;
          });

          updatedUnlocalisedFields = record.unlocalisedFields.filter((field)=>{
            const def = _.find(schemaDefinitions, { "key": field.key });
            console.log('def', def);
            if (def === undefined) {
              return false;
            }
            return def.unlocalised === true;
          }).map((unlocalisedField) => {
            return unlocalisedField;
          });
        }
        
        

        // merge in fields from input

        if (!_.isEmpty(args.localisedFieldInputs)) {
          args.localisedFieldInputs.map((localisedField) => {
            const updateIdex = _.findIndex(updatedFields, {
              key: localisedField.key
            });

            if (updateIdex !== -1) {
              // field key exist

              updatedFields[updateIdex].value = updateTranslatable({
                data: updatedFields[updateIdex].value, update: localisedField.value, locale: args.locale
              });
            } else {
              // field key not exist

              updatedFields.push({
                key: localisedField.key,
                value: [
                  {
                    locale: args.locale,
                    translation: localisedField.value
                  }
                ]
              })
            }

          });
        }

        
        if (!_.isEmpty(args.unlocalisedFieldInputs)) {
          args.unlocalisedFieldInputs.map((unlocalisedField) => {
            const updateIdex = _.findIndex(updatedUnlocalisedFields, {
              key: unlocalisedField.key
            });

            if (updateIdex !== -1) {
              // field key exist

              updatedUnlocalisedFields[updateIdex].value = unlocalisedField.value;
            } else {
              // field key not exist

              updatedUnlocalisedFields.push({
                key: unlocalisedField.key,
                value: unlocalisedField.value
              })
            }

          });
        }

        





        return CustomObject.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, {
          'meta.updatedAt': current,
          label: args.label,
          customOrder: args.customOrder === undefined ? 0 : args.customOrder,
          fields: updatedFields,
          unlocalisedFields: updatedUnlocalisedFields

        })
        }).then(() => {
          return CustomObject.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
        })
        .then((record) => {
          // console.log('record', record);

          return translateRecord(record.toObject(), args.locale);

        }
        )

    },




    deleteCustomObjectById: (root, args, context, info) => {
      console.log('deleteCustomObjectById', args);
      let current = Date.now();

      return CustomObject.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, { 'meta.deletedAt': current }).then((result) => {
        
        return CustomObject.findOne({ _id: args.id })


      })

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};