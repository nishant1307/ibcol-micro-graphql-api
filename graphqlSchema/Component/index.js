const _ = require('lodash');
const Component = require('./dbSchema.js');
const translate = require('../../helpers/translate.js');
const updateTranslatable = require('../../helpers/updateTranslatable.js');



const typeDefs = `
  extend type Query {
    getComponentById(id: ID!, locale: String): Component
    getComponentByName(name: String!, locale: String): Component
    getComponents(locale: String, orderBy: ComponentOrderBy): [Component]
    
  }

  extend type Mutation {
    addComponent(name: String!, locale: String!, schemaDefinitionInputs: [SchemaDefinitionInput], localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): Component
    updateComponent(id: ID!, name: String!, locale: String!, schemaDefinitionInputs: [SchemaDefinitionInput], localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): Component
    deleteComponentById(id: ID!): Component
    
  }



  enum ComponentOrderBy {
    name_ASC
    name_DESC
    createdAt_ASC
    createdAt_DESC
    updatedAt_ASC
    updatedAt_DESC
  }

  

  

  

  type LocalisedComponent {
    locale: String!
    fields: [LocalisedField]
  }

  
  type ComponentMeta {
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
  }

  type Component {
    id: ID!
    localisedContent: LocalisedComponent
    name: String!
    fields: [Field]
    unlocalisedFields: [UnlocalisedField]
    schemaDefinitions: [SchemaDefinition]
    meta: ComponentMeta
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
    getComponents: (root, args, context, info) => {

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

      return Component.find({ 'meta.deletedAt': { $exists: false } }, null, {
        sort
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
    
    

    getComponentByName: (root, args, context, info) => {

      return Component.findOne({ name: args.name, 'meta.deletedAt': { $exists: false } }).then(
        (record) => {
          if (args.locale !== undefined) {


            return translateRecord(record.toObject(), args.locale);
          } else {
            return record;
          }
        }
      );
    },

    getComponentById: (root, args, context, info) => {

      return Component.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }).then(
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


  Component: {
    id: ({
      _id
    }) => typeof _id === 'string' ? _id : _id.toString(),
  },

  Mutation: {
    addComponent: (root, args, context, info) => {
      console.log('addComponent', args);
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

      

      return Component.findOne({ name: args.name, 'meta.deletedAt': { $exists: false } }).then((record) => {

        if (!_.isEmpty(record)) {
          throw(`Component with name ${args.name} already exists.`);
        }
      }).then(() => {
        return Component.create({
          
          name: args.name,
          meta: {
            createdAt: current,
            updatedAt: current
          },
          schemaDefinitions: args.schemaDefinitionInputs,
          fields,
          unlocalisedFields
      })
      })
      .then((record) => {
          // console.log('record', record);
          
        return translateRecord(record.toObject(), args.locale);

        }
      )

    },



    updateComponent: (root, args, context, info) => {
      console.log('updateComponent', args);
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



      return Component.findOne({ name: args.name, _id: { $ne: args.id } , 'meta.deletedAt': { $exists: false } }).then((record) => {

        if (!_.isEmpty(record)) {
          throw (`Name ${args.name} is already in use by another record.`);
        }
      }).then(() => {
        return Component.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
      }).then((record) => {
        
        

        
        const schemaDefinitions = !_.isEmpty(args.schemaDefinitionInputs) ? args.schemaDefinitionInputs : record.schemaDefinitions;


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

        


        





        return Component.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, {
          'meta.updatedAt': current,
          name: args.name,
          schemaDefinitions,
          fields: updatedFields,
          unlocalisedFields: updatedUnlocalisedFields


        })
        }).then(() => {
          return Component.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
        })
        .then((record) => {
          // console.log('record', record);

          return translateRecord(record.toObject(), args.locale);

        }
        )

    },




    deleteComponentById: (root, args, context, info) => {
      console.log('deleteComponentById', args);
      let current = Date.now();

      return Component.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, { 'meta.deletedAt': current }).then((result) => {
        
        return Component.findOne({ _id: args.id })


      })

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};