const _ = require('lodash');
const Application = require('./dbSchema.js');
const randomstring = require("randomstring");
const axios = require('axios');

const getApplicationByRef = (ref) => {
  return Application.findOne({ ref });
}

const storeFile = async (fileId) => {
  return await axios.put(`${process.env.FILEPOND_API_URL}${process.env.FILEPOND_API_ENDPOINT}`, fileId);
}

const injectNewProjectFilesToProject = (projectRecord) => {
  // console.log('injectNewProjectFilesToProject', projectRecord);


  if (_.isEmpty(projectRecord.whitepaperFileIds))
    projectRecord.whitepaperFileIds = [];

  if (_.isEmpty(projectRecord.presentationFileIds))
    projectRecord.presentationFileIds = [];

  if (!_.isEmpty(projectRecord.whitepaperFileId))
    projectRecord.whitepaperFileIds.push(projectRecord.whitepaperFileId);

  if (!_.isEmpty(projectRecord.presentationFileId))
    projectRecord.presentationFileIds.push(projectRecord.presentationFileId);

  delete projectRecord.whitepaperFileId;
  delete projectRecord.presentationFileId;
  
  return projectRecord;
}

const generateUniqueReference = async () => {
  const ref = `${randomstring.generate({
    length: 3,
    charset: 'alphabetic',
    capitalization: 'uppercase',
    readable: true
  })}-${randomstring.generate({
    length: 10,
    charset: 'alphanumeric',
    capitalization: 'uppercase',
    readable: true
  })}`;

  

  const existingApplication = await getApplicationByRef(ref);
  console.log('existingApplication', existingApplication);

  console.log('ref', ref);


  if (existingApplication !== null) {
    return generateUniqueReference();
  } else {
    return ref;
  }

  
}


const typeDefs = `
  #extend type Query {
    # getApplicationById(id: ID!): Application
    # getApplications(orderBy: ApplicationOrderBy): [Application]
  #}

  extend type Mutation {
    addApplication(application: ApplicationInput!): Application

    # updateApplication(id: ID!, slug: String!, locale: String!, localisedPageInput: LocalisedPageInput, schemaDefinitionInputs: [SchemaDefinitionInput], localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): Application

    deleteApplicationById(id: ID!): Application
    
  }



  enum ApplicationOrderBy {
    createdAt_ASC
    createdAt_DESC
    updatedAt_ASC
    updatedAt_DESC
  }


  input ApplicationInput {
    teamName: String!
    studentRecords: [StudentRecordInput!]!
    advisorRecords: [AdvisorRecordInput]
    projectRecords: [ProjectRecordInput!]!
  }

  input StudentRecordInput {
    firstName: String!
    lastName: String!
    phoneNumber: String
    email: String!
    educationRecords: [EducationRecordInput!]!
  }

  input EducationRecordInput {
    institutionName: String!
    state: String!
    city: String!
    countryCode: String!
    degree: String!
    programme: String!
    yearOfGraduation: String!
    studentNumber: String
    studentCardFrontFileId: String
    studentCardBackFileId: String
    transcriptFileId: String
  }

  input AdvisorRecordInput {
    firstName: String!
    lastName: String!
    phoneNumber: String
    email: String!
    associationRecords: [AssociationRecordInput!]!
  }



  input AssociationRecordInput {
    organisationName: String!
    title: String!
    sectorCode: String!
    state: String!
    city: String!
    countryCode: String!
    yearCommencement: String!
    yearCessation: String
  }


  input ProjectRecordInput {
    name: String!
    projectCategoryKey: String!
    description: String!
    whitepaperFileId: String
    presentationFileId: String
  }




  type Application {
    id: ID!
    ref: String!
    teamName: String!
    studentRecords: [StudentRecord!]!
    advisorRecords: [AdvisorRecord]
    projectRecords: [ProjectRecord!]!
    verificationKeys: [VerificationKey]!
    meta: ApplicationMeta
  }

  type StudentRecord {
    firstName: String!
    lastName: String!
    phoneNumber: String
    email: String!
    educationRecords: [EducationRecord!]!
  }

  type EducationRecord {
    institutionName: String!
    state: String!
    city: String!
    countryCode: String!
    degree: String!
    programme: String!
    yearOfGraduation: String!
    studentNumber: String
    studentCardFrontFileId: String
    studentCardBackFileId: String
    transcriptFileId: String
  }

  type AdvisorRecord {
    firstName: String!
    lastName: String!
    phoneNumber: String
    email: String!
    associationRecords: [AssociationRecord!]!
  }

  type AssociationRecord {
    organisationName: String!
    title: String!
    sectorCode: String!
    state: String!
    city: String!
    countryCode: String!
    yearCommencement: String!
    yearCessation: String
  }

  type ProjectRecord {
    name: String!
    projectCategoryKey: String!
    description: String!
    whitepaperFileIds: [String]!
    presentationFileIds: [String]!
  }

  type ApplicationMeta {
    createdAt: Date
    updatedAt: Date
    approvedAt: Date
    rejectedAt: Date
    deletedAt: Date
  }

  type VerificationKey {
    publicKey: String!
    password: String!
  }

`;




const resolvers = {
  Query: {
    // getPages: (root, args, context, info) => {

    //   const orderBy = _.isEmpty(args.orderBy) ? 'updatedAt_DESC' : args.orderBy;
    //   // console.log(">>>>>>", args, orderBy);
    //   let sort = {};

    //   // slug_ASC
    //   // slug_DESC
    //   // title_ASC
    //   // title_DESC
    //   // createdAt_ASC
    //   // createdAt_DESC
    //   // updatedAt_ASC
    //   // updatedAt_DESC


    //   switch (orderBy) {
    //     case 'slug_ASC':
    //       sort = {
    //         slug: 1
    //       };
    //       break;
    //     case 'slug_DESC':
    //       sort = {
    //         slug: -1
    //       };
    //       break;
    //     case 'createdAt_ASC':
    //       sort = {
    //         'meta.createdAt': 1
    //       };
    //       break;
    //     case 'createdAt_DESC':
    //       sort = {
    //         'meta.createdAt': -1
    //       };
    //       break;
    //     case 'updatedAt_ASC':
    //       sort = {
    //         'meta.updatedAt': 1
    //       };
    //       break;
    //     case 'updatedAt_DESC':
    //       sort = {
    //         'meta.updatedAt': -1
    //       };
    //       break;
    //   }

    //   return Page.find({ 'meta.deletedAt': { $exists: false } }, null, {
    //     sort
    //   }).then(
    //     (records) => {
    //       if (args.locale !== undefined) {


    //         let translatedRecords = records.map((record) => {
    //           return translateRecord(record.toObject(), args.locale)
    //         })

    //         if (orderBy === 'title_ASC' || orderBy === 'title_DESC') {
    //           translatedRecords = _.orderBy(translatedRecords, ['localisedContent.title'], [orderBy === 'title_ASC' ? 'asc' : 'desc']);

    //           // console.log('orderBy!!!', orderBy);
    //         }

    //         return translatedRecords;
    //       } else {
    //         return records;
    //       }
    //     }
    //   );
      
    // },
    
    

    // getPageBySlug: (root, args, context, info) => {

    //   return Page.findOne({ slug: args.slug, 'meta.deletedAt': { $exists: false } }).then(
    //     (record) => {
    //       if (args.locale !== undefined) {


    //         return translateRecord(record.toObject(), args.locale);
    //       } else {
    //         return record;
    //       }
    //     }
    //   );
    // },

    // getPageById: (root, args, context, info) => {

    //   return Page.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }).then(
    //     (record) => {
    //       if (args.locale !== undefined) {


    //         return translateRecord(record.toObject(), args.locale);
    //       } else {
    //         return record;
    //       }
    //     }
    //   );
    // }

    
  },


  Application: {
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
    addApplication: (root, args, context, info) => {
      console.log('addApplication', args);
      let current = Date.now();

      
      const application = args.application;
      

      return Application.findOne({ teamName: new RegExp(`^${application.teamName}$`, 'i'), 'meta.deletedAt': { $exists: false } }).then((record) => {
        // console.log('page', page);

        if (!_.isEmpty(record)) {
          throw(`Application with team name ${application.teamName} already exists.`);
        }
      }).then( async () => {

        // const studentRecords = [];
        // const advisorRecords = [];
        // const projectRecords = [];

        const ref = await generateUniqueReference();

        // console.log("ref2", ref);

        
        

        return Application.create({
          meta: {
            createdAt: current,
            updatedAt: current
          },
          verificationKeys: [
            {
              "publicKey": ref+randomstring.generate({
                length: 12,
                charset: 'alphanumeric'
              }),
              "password": randomstring.generate({
                length: 10,
                readable: true,
                charset: 'abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@_-~.?*&^%#()'
              })
            }
          ],
          ref,
          teamName: application.teamName,
          studentRecords: application.studentRecords,
          advisorRecords: application.advisorRecords,
          projectRecords: application.projectRecords.map(r=>injectNewProjectFilesToProject(r))
        })
      })
      .then( async (record) => {
        // process files attached in record

        
        record.studentRecords.map((studentRecord)=>{
          studentRecord.educationRecords.map((educationRecord)=>{
          if (!_.isEmpty(educationRecord.studentCardFrontFileId))
            storeFile(educationRecord.studentCardFrontFileId);
          if (!_.isEmpty(educationRecord.studentCardBackFileId))
            storeFile(educationRecord.studentCardBackFileId);
          if (!_.isEmpty(educationRecord.transcriptFileId))
            storeFile(educationRecord.transcriptFileId);
          })
        });

        record.projectRecords.map((projectRecord)=>{

          projectRecord.whitepaperFileIds.map(fileId=>storeFile(fileId));
          projectRecord.presentationFileIds.map(fileId=>storeFile(fileId));
          
        });

        return record;

      })
      .then( (record) => {
        
        return record;

      })

    },



    // updatePage: (root, args, context, info) => {
    //   console.log('updatePage', args);
    //   let current = Date.now();

    //   // let fields = [];

    //   // if (!_.isEmpty(args.localisedFieldInputs)) {
    //   //   args.localisedFieldInputs.map((localisedField) => {
    //   //     fields.push({
    //   //       key: localisedField.key,
    //   //       value: [
    //   //         {
    //   //           locale: args.locale,
    //   //           translation: localisedField.value
    //   //         }
    //   //       ]
    //   //     })
    //   //   });
    //   // }



    //   return Page.findOne({ slug: args.slug, _id: { $ne: args.id }, 'meta.deletedAt': { $exists: false } }).then((record) => {
    //     // console.log('page', page);

    //     if (!_.isEmpty(record)) {
    //       throw (`Slug ${args.slug} is already in use by another record.`);
    //     }
    //   }).then(() => {
    //     return Page.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
    //   }).then((record) => {
        
        

        

        
    //     const schemaDefinitions = !_.isEmpty(args.schemaDefinitionInputs) ? args.schemaDefinitionInputs : record.schemaDefinitions;
        

    //     let updatedFields = [];
    //     let updatedUnlocalisedFields = [];

    //     if (!_.isEmpty(schemaDefinitions)) {
          
    //       updatedFields = record.fields.filter((field)=>{
    //         const def = _.find(schemaDefinitions, { "key": field.key });
    //         // console.log('def', def);
    //         if (def === undefined) {
    //           return false;
    //         }
    //         return def.unlocalised !== true;
    //       }).map((field) => {
    //         // clean up __typename
    //         // field.__typename = undefined;
    //         return field;
    //       });

    //       updatedUnlocalisedFields = record.unlocalisedFields.filter((field)=>{
    //         const def = _.find(schemaDefinitions, { "key": field.key });
    //         console.log('def', def);
    //         if (def === undefined) {
    //           return false;
    //         }
    //         return def.unlocalised === true;
    //       }).map((unlocalisedField) => {
    //         return unlocalisedField;
    //       });
    //     }
        
        

    //     // merge in fields from input

    //     if (!_.isEmpty(args.localisedFieldInputs)) {
    //       args.localisedFieldInputs.map((localisedField) => {
    //         const updateIdex = _.findIndex(updatedFields, {
    //           key: localisedField.key
    //         });

    //         if (updateIdex !== -1) {
    //           // field key exist

    //           updatedFields[updateIdex].value = updateTranslatable({
    //             data: updatedFields[updateIdex].value, update: localisedField.value, locale: args.locale
    //           });
    //         } else {
    //           // field key not exist

    //           updatedFields.push({
    //             key: localisedField.key,
    //             value: [
    //               {
    //                 locale: args.locale,
    //                 translation: localisedField.value
    //               }
    //             ]
    //           })
    //         }

    //       });
    //     }

    //     if (!_.isEmpty(args.unlocalisedFieldInputs)) {
    //       args.unlocalisedFieldInputs.map((unlocalisedField) => {
    //         const updateIdex = _.findIndex(updatedUnlocalisedFields, {
    //           key: unlocalisedField.key
    //         });

    //         if (updateIdex !== -1) {
    //           // field key exist

    //           updatedUnlocalisedFields[updateIdex].value = unlocalisedField.value;
    //         } else {
    //           // field key not exist

    //           updatedUnlocalisedFields.push({
    //             key: unlocalisedField.key,
    //             value: unlocalisedField.value
    //           })
    //         }

    //       });
    //     }


        





    //     return Page.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, {
    //       'meta.updatedAt': current,
    //       slug: args.slug,
    //       schemaDefinitions,
    //       title: updateTranslatable({
    //         data: record.title, update: args.localisedPageInput.title, locale: args.locale
    //       }),
    //       'seo.title': updateTranslatable({
    //         data: record.seo.title, update: args.localisedPageInput.seoTitle, locale: args.locale
    //       }),
    //       'seo.description': updateTranslatable({
    //         data: record.seo.description, update: args.localisedPageInput.seoDescription, locale: args.locale
    //       }),
    //       'seo.tags': updateTranslatable({
    //         data: record.seo.tags, update: args.localisedPageInput.seoTags, locale: args.locale
    //       }),
    //       'seo.image': updateTranslatable({
    //         data: record.seo.image, update: args.localisedPageInput.seoImage, locale: args.locale
    //       }),
    //       fields: updatedFields,
    //       unlocalisedFields: updatedUnlocalisedFields


    //     })
    //     }).then(() => {
    //       return Page.findOne({ _id: args.id, 'meta.deletedAt': { $exists: false } })
    //     })
    //     .then((record) => {
    //       // console.log('record', record);

    //       return translateRecord(record.toObject(), args.locale);

    //     }
    //     )

    // },




    deleteApplicationById: (root, args, context, info) => {
      console.log('deleteApplicationById', args);
      let current = Date.now();

      return Application.updateOne({ _id: args.id, 'meta.deletedAt': { $exists: false } }, { 'meta.deletedAt': current }).then((result) => {
        
        return Application.findOne({ _id: args.id })


      })

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};