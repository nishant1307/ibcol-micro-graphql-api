const _ = require('lodash');
const Page = require('./dbSchema.js');
const translate = require('../../helpers/translate.js');
const updateTranslatable = require('../../helpers/updateTranslatable.js');



const typeDefs = `
  extend type Query {
    getPageById(id: ID!, locale: String): Page
    getPageBySlug(slug: String!, locale: String): Page
    getPages(locale: String, orderBy: PageOrderBy): [Page]
    
  }

  extend type Mutation {
    addPage(slug: String!, locale: String!, localisedPageInput: LocalisedPageInput, schemaDefinitionInputs: [SchemaDefinitionInput], localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): Page
    updatePage(id: ID!, slug: String!, locale: String!, localisedPageInput: LocalisedPageInput, schemaDefinitionInputs: [SchemaDefinitionInput], localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): Page
    deletePageById(id: ID!): Page
    
  }



  enum PageOrderBy {
    slug_ASC
    slug_DESC
    title_ASC
    title_DESC
    createdAt_ASC
    createdAt_DESC
    updatedAt_ASC
    updatedAt_DESC
  }

  input LocalisedPageInput {
    title: String
    seoTitle: String
    seoDescription: String
    seoTags: String
    seoImage: String
    
    
    
  }


  

  

  type LocalisedPage {
    locale: String!
    title: String
    fields: [LocalisedField]
    unlocalisedFields: [UnlocalisedField]
    seo: LocalisedSEOFields
  }

  type SEOFields {
    title: [Translatable]
    description: [Translatable]
    tags: [Translatable]
    image: [Translatable]
  }

  type LocalisedSEOFields {
    title: String
    description: String
    tags: String
    image: String
  }

  type PageMeta {
    createdAt: Date
    updatedAt: Date
    publishAt: Date
    unpublishAt: Date
    deletedAt: Date
  }

  type Page {
    id: ID!
    title: [Translatable]!
    seo: SEOFields
    localisedContent: LocalisedPage
    slug: String!
    fields: [Field]
    unlocalisedFields: [UnlocalisedField]
    schemaDefinitions: [SchemaDefinition]
    meta: PageMeta
  }

  

`;


const translateRecord = (record, locale) => {

  return Object.assign({}, record, {
    localisedContent: {
      locale: locale,
      title: translate(record.title, locale),
      fields: record.fields.map((field) => {
        return Object.assign({}, field, {
          value: translate(field.value, locale)
        })
      }),
      seo: {
        title: _.isEmpty(record.seo.title) ? "" : translate(record.seo.title, locale),
        description: _.isEmpty(record.seo.description) ? "" : translate(record.seo.description, locale),
        tags: _.isEmpty(record.seo.tags) ? "" : translate(record.seo.tags, locale),
        image: _.isEmpty(record.seo.image) ? "" : translate(record.seo.image, locale)
      }
    }
  });
}



const resolvers = {
  Query: {
    getPages: (root, args, context, info) => {

      const orderBy = _.isEmpty(args.orderBy) ? 'updatedAt_DESC' : args.orderBy;
      // console.log(">>>>>>", args, orderBy);
      let sort = {};

      // slug_ASC
      // slug_DESC
      // title_ASC
      // title_DESC
      // createdAt_ASC
      // createdAt_DESC
      // updatedAt_ASC
      // updatedAt_DESC


      switch (orderBy) {
        case 'slug_ASC':
          sort = {
            slug: 1
          };
          break;
        case 'slug_DESC':
          sort = {
            slug: -1
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

      return Page.find({ 'meta.deletedAt': { $exists: false } }, null, {
        sort
      }).then(
        (records) => {
          if (args.locale !== undefined) {


            let translatedRecords = records.map((record) => {
              return translateRecord(record.toObject(), args.locale)
            })

            if (orderBy === 'title_ASC' || orderBy === 'title_DESC') {
              translatedRecords = _.orderBy(translatedRecords, ['localisedContent.title'], [orderBy === 'title_ASC' ? 'asc' : 'desc']);

              // console.log('orderBy!!!', orderBy);
            }

            return translatedRecords;
          } else {
            return records;
          }
        }
      );
      
    },
    
    

    getPageBySlug: (root, args, context, info) => {

      return Page.findOne({ slug: args.slug, 'meta.deletedAt': { $exists: false } }).then(
        (record) => {
          if (args.locale !== undefined) {


            return translateRecord(record.toObject(), args.locale);
          } else {
            return record;
          }
        }
      );
    },

    getPageById: (root, args, context, info) => {

      return Page.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }).then(
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


  Page: {
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
    addPage: (root, args, context, info) => {
      console.log('addPage', args);
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

      

      return Page.findOne({ slug: args.slug, 'meta.deletedAt': { $exists: false } }).then((record) => {
        // console.log('page', page);

        if (!_.isEmpty(record)) {
          throw(`Page with slug ${args.slug} already exists.`);
        }
      }).then(() => {
        return Page.create({
          title: [
            {
              locale: args.locale,
              translation: args.localisedPageInput.title
            }
          ],
          slug: args.slug,
          seo: {
            title: [
              {
                locale: args.locale,
                translation: args.localisedPageInput.seoTitle
              }
            ],
            description: [
              {
                locale: args.locale,
                translation: args.localisedPageInput.seoDescription
              }
            ],
            tags: [
              {
                locale: args.locale,
                translation: args.localisedPageInput.seoTags
              }
            ],
            image: {
              locale: args.locale,
              translation: args.localisedPageInput.seoImage
            }
          },
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



    updatePage: (root, args, context, info) => {
      console.log('updatePage', args);
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



      return Page.findOne({ slug: args.slug, _id: { $ne: args.id }, 'meta.deletedAt': { $exists: false } }).then((record) => {
        // console.log('page', page);

        if (!_.isEmpty(record)) {
          throw (`Slug ${args.slug} is already in use by another record.`);
        }
      }).then(() => {
        return Page.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
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


        





        return Page.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, {
          'meta.updatedAt': current,
          slug: args.slug,
          schemaDefinitions,
          title: updateTranslatable({
            data: record.title, update: args.localisedPageInput.title, locale: args.locale
          }),
          'seo.title': updateTranslatable({
            data: record.seo.title, update: args.localisedPageInput.seoTitle, locale: args.locale
          }),
          'seo.description': updateTranslatable({
            data: record.seo.description, update: args.localisedPageInput.seoDescription, locale: args.locale
          }),
          'seo.tags': updateTranslatable({
            data: record.seo.tags, update: args.localisedPageInput.seoTags, locale: args.locale
          }),
          'seo.image': updateTranslatable({
            data: record.seo.image, update: args.localisedPageInput.seoImage, locale: args.locale
          }),
          fields: updatedFields,
          unlocalisedFields: updatedUnlocalisedFields


        })
        }).then(() => {
          return Page.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
        })
        .then((record) => {
          // console.log('record', record);

          return translateRecord(record.toObject(), args.locale);

        }
        )

    },




    deletePageById: (root, args, context, info) => {
      console.log('deletePageById', args);
      let current = Date.now();

      return Page.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, { 'meta.deletedAt': current }).then((result) => {
        
        return Page.findOne({ _id: args.id })


      })

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};