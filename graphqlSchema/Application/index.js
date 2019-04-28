const _ = require('lodash');
const Application = require('./dbSchema.js');
const randomstring = require("randomstring");
const {isTokenValid} = require('../../helpers/auth.js');
const axios = require('axios');

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
  })}${timestamp ? Date.now(): ''}`;


  

  const existingApplication = await getOneApplicationByRef(ref);
  console.log('existingApplication', existingApplication);

  console.log('ref', ref);


  if (existingApplication !== null) {
    return await generateUniqueReference();
  } else {
    return ref;
  }

  
}

const generateProjectReference = () => {
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
  })}${Date.now()}`;


  return ref;
  
}

const getOneApplicationByRef = (ref) => {
  return Application.findOne({ ref });
}

const storeFile = async (fileId) => {
  console.log(`requesting to storeFile ${fileId}...`);

  const result = await axios.put(`${process.env.FILEPOND_API_URL}${process.env.FILEPOND_API_ENDPOINT}`, fileId);
  // console.log(result);
  return result;

}

const removeFile = async (fileId) => {
  console.log(`requesting to removeFile ${fileId}...`);

  const result = await axios.delete(`${process.env.FILEPOND_API_URL}${process.env.FILEPOND_API_ENDPOINT}`, {data: fileId});
  // console.log(result);
  return result;

}

const injectNewProjectFilesToProject = (projectRecord, existingProjects) => {
  // console.log('injectNewProjectFilesToProject', projectRecord, existingProjects);
  
  let current = Date.now();

  const updatedProjectRecord = (existingProjects && projectRecord.ref) ? _.find(existingProjects, {ref: projectRecord.ref}) : Object.assign({}, projectRecord);

  // console.log('updatedProjectRecord', updatedProjectRecord);
  // console.log('updatedProjectRecord.whitepaperFileIds', updatedProjectRecord.whitepaperFileIds);

  if (_.isEmpty(updatedProjectRecord.whitepaperFileIds))
    updatedProjectRecord.whitepaperFileIds = [];

  if (_.isEmpty(updatedProjectRecord.presentationFileIds))
    updatedProjectRecord.presentationFileIds = [];

  if (!_.isEmpty(projectRecord.whitepaperFileId))
    updatedProjectRecord.whitepaperFileIds.push({fileId: projectRecord.whitepaperFileId, receivedAt: current});

  if (!_.isEmpty(projectRecord.presentationFileId))
    updatedProjectRecord.presentationFileIds.push({fileId: projectRecord.presentationFileId, receivedAt: current});

  delete updatedProjectRecord.whitepaperFileId;
  delete updatedProjectRecord.presentationFileId;
  
  return updatedProjectRecord;
}

const patchProjectOutputs = (application) => {
  return Object.assign({}, application, {
    projectRecords: application.projectRecords.map((projectRecord)=>{
        return {
          ref: projectRecord.ref,
          name: projectRecord.name,
          projectCategoryKey: projectRecord.projectCategoryKey,
          description: projectRecord.description,
          whitepaperFileIds: projectRecord.whitepaperFileIds ? projectRecord.whitepaperFileIds.map((fileId)=>{
            if (typeof(fileId) === 'string') {
              return {fileId, receivedAt: undefined}
            } else if (typeof(fileId) === 'object') {
              return fileId
            }
          }) : [],
          presentationFileIds: projectRecord.presentationFileIds ? projectRecord.presentationFileIds.map((fileId)=>{
            if (typeof(fileId) === 'string') {
              return {fileId, receivedAt: undefined}
            } else if (typeof(fileId) === 'object') {
              return fileId
            }
          }) : []
        }
      })
  });
}





const typeDefs = `
  extend type Query {
    # getApplicationById(id: ID!): Application
    getApplicationsAsAdmin(accessToken: TokenInput!): [Application]!
    getApplications(accessToken: TokenInput!): [Application]!
  }

  extend type Mutation {
    addApplication(application: ApplicationInput!): Application

    updateApplication(accessToken: TokenInput!, application: ApplicationUpdateInput!): Application

    #patchApplications: [Application]

    deleteApplicationById(id: ID!): Application
    
  }



  

  input ApplicationInput {
    teamName: String!
    studentRecords: [StudentRecordInput!]!
    advisorRecords: [AdvisorRecordInput]
    projectRecords: [ProjectRecordInput!]!
  }

  input ApplicationUpdateInput {
    ref: String!
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
    ref: String
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
    emailVerified: Boolean
    phoneNumberVerified: Boolean
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
    isVerified: Boolean
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
    ref: String!
    name: String!
    projectCategoryKey: String!
    description: String!
    whitepaperFileIds: [DropFile]
    presentationFileIds: [DropFile]
  }

  type DropFile {
    receivedAt: Date
    fileId: String!
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

    getApplications: async (root, args, context, info) => {
      console.log('getApplications', args);
      

      if (!await isTokenValid(args.accessToken)) {
        throw('Invalid token.');
      }

      const email = args.accessToken.email;

      const applications = await Application.find({"studentRecords.email": email,
        deletedAt: {
          $exists: false
        }}).lean();
      // console.log('applications', applications);
      // console.log('applications (patched)', applications.map((application)=>fixDropFiles(application)));
      return applications.map((application)=>patchProjectOutputs(application));
    },

    getApplicationsAsAdmin: async (root, args, context, info) => {
      console.log('getApplicationsAsAdmin', args);
      

      if (!await isTokenValid(args.accessToken, true)) {
        throw('Invalid admin token.');
      }


      const applications = await Application.find({
        deletedAt: {
          $exists: false
        }}).lean();
      // console.log('applications', applications);
      // console.log('applications (patched)', applications.map((application)=>fixDropFiles(application)));
      return applications.map((application)=>patchProjectOutputs(application));
    },
    
    
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
          projectRecords: application.projectRecords.map(projectRecord=>injectNewProjectFilesToProject(projectRecord)).map((projectRecord)=>{
            // add project ref to new project in new applications
            return Object.assign({}, projectRecord, {ref: generateProjectReference()})
          })
        })
      })
      .then(async (record) => {
        // process files attached in record

        // flatten and store
        const tmpFiles = [];

        record.studentRecords.map((studentRecord)=>{
          studentRecord.educationRecords.map((educationRecord)=>{
          if (!_.isEmpty(educationRecord.studentCardFrontFileId))
            tmpFiles.push(educationRecord.studentCardFrontFileId);
          if (!_.isEmpty(educationRecord.studentCardBackFileId))
            tmpFiles.push(educationRecord.studentCardBackFileId);
          if (!_.isEmpty(educationRecord.transcriptFileId))
            tmpFiles.push(educationRecord.transcriptFileId);
          })
        });

        record.projectRecords.map((projectRecord)=>{

          projectRecord.whitepaperFileIds.map((fileId)=>{
            if (typeof(fileId) === 'string') {
              tmpFiles.push(fileId);
            } else if (typeof(fileId) === 'object') {
              tmpFiles.push(fileId.fileId);
            }
            
          });
          projectRecord.presentationFileIds.map((fileId)=>{
            if (typeof(fileId) === 'string') {
              tmpFiles.push(fileId);
            } else if (typeof(fileId) === 'object') {
              tmpFiles.push(fileId.fileId);
            }
          });
          
        });


        console.log(`${tmpFiles.length} files needed to be saved:`, tmpFiles);
        
        for (const file of tmpFiles) {
          const result = await storeFile(file);
          // console.log(result);
        }

        console.log('saved record', record);

        return record;
        

        

      })

    },
    updateApplication: async (root, args, context, info) => {
      console.log('updateApplication', args);
      let current = Date.now();


      

      if (!await isTokenValid(args.accessToken)) {
        throw('Invalid token.');
      }
      
      const application = args.application;
      const email = args.accessToken.email;

      const existingTeamApplication = await Application.findOne({ teamName: new RegExp(`^${application.teamName}$`, 'i'), ref: {$ne: application.ref},  'meta.deletedAt': { $exists: false } });

      if (existingTeamApplication) {
        throw(`Team name ${application.teamName} is already used by another team.`);
      }

      const currentApplication = await Application.findOne({"studentRecords.email": email, ref: application.ref, 'meta.deletedAt': { $exists: false }}).lean();

      
      if (!currentApplication) {
        throw(`Cannot find application ref #${application.ref}.`);
      }

      // console.log('currentApplication', currentApplication);
      


      // original files
      const originalFiles = [];

      currentApplication.studentRecords.map((studentRecord)=>{
        studentRecord.educationRecords.map((educationRecord)=>{
        if (!_.isEmpty(educationRecord.studentCardFrontFileId))
          originalFiles.push(educationRecord.studentCardFrontFileId);
        if (!_.isEmpty(educationRecord.studentCardBackFileId))
          originalFiles.push(educationRecord.studentCardBackFileId);
        if (!_.isEmpty(educationRecord.transcriptFileId))
          originalFiles.push(educationRecord.transcriptFileId);
        })
      });

      currentApplication.projectRecords.map((projectRecord)=>{
        

        if (projectRecord.whitepaperFileIds) projectRecord.whitepaperFileIds.map((fileId)=>{
          if (typeof(fileId) === 'string') {
            originalFiles.push(fileId);
          } else if (typeof(fileId) === 'object') {
            originalFiles.push(fileId.fileId);
          }
        });

        if (projectRecord.presentationFileIds)  projectRecord.presentationFileIds.map((fileId)=>{
          if (typeof(fileId) === 'string') {
            originalFiles.push(fileId);
          } else if (typeof(fileId) === 'object') {
            originalFiles.push(fileId.fileId);
          }
        });
        
      });
      console.log('originalFiles', originalFiles);


      const updatedApplication = await Application.findOneAndUpdate({ref: application.ref, 'meta.deletedAt': { $exists: false }},
      {
        $set: {
          'meta.updatedAt': current,
          teamName: application.teamName,
          studentRecords: application.studentRecords,
          advisorRecords: application.advisorRecords,
          projectRecords: application.projectRecords.map(projectRecord=>injectNewProjectFilesToProject(projectRecord, currentApplication.projectRecords)).map((projectRecord)=>{
            // add project ref to new project in existing application (new project will not have a ref)
            return (!_.isEmpty(projectRecord.ref)) ? projectRecord : Object.assign({}, projectRecord, {ref: generateProjectReference()})
          })
        }
      }, {new: true});


      // flatten and store
      const tmpFiles = [];

      updatedApplication.studentRecords.map((studentRecord)=>{
        studentRecord.educationRecords.map((educationRecord)=>{
        if (!_.isEmpty(educationRecord.studentCardFrontFileId))
          tmpFiles.push(educationRecord.studentCardFrontFileId);
        if (!_.isEmpty(educationRecord.studentCardBackFileId))
          tmpFiles.push(educationRecord.studentCardBackFileId);
        if (!_.isEmpty(educationRecord.transcriptFileId))
          tmpFiles.push(educationRecord.transcriptFileId);
        })
      });

      updatedApplication.projectRecords.map((projectRecord)=>{

        projectRecord.whitepaperFileIds.map((fileId)=>{
          if (typeof(fileId) === 'string') {
            tmpFiles.push(fileId);
          } else if (typeof(fileId) === 'object') {
            tmpFiles.push(fileId.fileId);
          }
        });
        projectRecord.presentationFileIds.map((fileId)=>{
          if (typeof(fileId) === 'string') {
            tmpFiles.push(fileId);
          } else if (typeof(fileId) === 'object') {
            tmpFiles.push(fileId.fileId);
          }
        });
        
      });

      
      console.log('tmpFiles', tmpFiles);


      const newFiles = _.difference(tmpFiles, originalFiles);
      const expiredFiles = _.difference(originalFiles, tmpFiles);


      console.log(`${newFiles.length} files needed to be saved:`, newFiles);
      
      // store newFiles
      for (const file of newFiles) {
        const result = await storeFile(file);
        // console.log(result);
      }

      console.log(`${expiredFiles.length} files needed to be removed:`, expiredFiles);

      // remove expiredFiles
      for (const file of expiredFiles) {
        const result = await removeFile(file);
        // console.log(result);
      }





      return updatedApplication;

      


    },

    // patchApplications: async (root, args, context, info) => {
    //   console.log('patchApplications', args);
    //   let current = Date.now();


    //   // const email = args.email.toLowerCase().trim();
    //   // const token = args.token.trim();

    //   // if (!await isTokenValid(email, token)) {
    //   //   throw('Invalid token.');
    //   // }
      
    //   // const application = args.application;

      

    //   const applications = await Application.find().lean();
      

    //   for (const application of applications) {
    //     console.log(`processing application ref #${application.ref}...`)
    //     let needPatch = false;

    //     const projectRecords = application.projectRecords.map( (projectRecord) => {
    //       if (projectRecord.ref === undefined)
    //         needPatch = true;

    //       return projectRecord.ref ? projectRecord : Object.assign({}, projectRecord, {ref: generateProjectReference()})
    //     })

    //     if (needPatch) {
    //       console.log(`patching application ref #${application.ref}...`)
    //       await Application.updateOne({ref: application.ref}, {
    //         projectRecords
    //       })
    //       console.log(`patched ref #${application.ref}.`)
    //     }


    //   }
      

      




    //   return await Application.find();

      


    // },



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