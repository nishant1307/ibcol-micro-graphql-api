const _ = require('lodash-checkit');
const AccessToken = require('./dbSchema.js');
const Application = require('../Application/dbSchema.js');
const randomstring = require("randomstring");
const axios = require('axios');

// const getApplicationByRef = (ref) => {
//   return Application.findOne({ ref });
// }

// const storeFile = async (fileId) => {
//   console.log(`requesting to storeFile ${fileId}...`);

//   const result = await axios.put(`${process.env.FILEPOND_API_URL}${process.env.FILEPOND_API_ENDPOINT}`, fileId);
//   console.log(result);
//   return result;

// }

// const injectNewProjectFilesToProject = (projectRecord) => {
//   // console.log('injectNewProjectFilesToProject', projectRecord);


//   if (_.isEmpty(projectRecord.whitepaperFileIds))
//     projectRecord.whitepaperFileIds = [];

//   if (_.isEmpty(projectRecord.presentationFileIds))
//     projectRecord.presentationFileIds = [];

//   if (!_.isEmpty(projectRecord.whitepaperFileId))
//     projectRecord.whitepaperFileIds.push(projectRecord.whitepaperFileId);

//   if (!_.isEmpty(projectRecord.presentationFileId))
//     projectRecord.presentationFileIds.push(projectRecord.presentationFileId);

//   delete projectRecord.whitepaperFileId;
//   delete projectRecord.presentationFileId;
  
//   return projectRecord;
// }

// const generateUniqueReference = async () => {
//   const ref = `${randomstring.generate({
//     length: 3,
//     charset: 'alphabetic',
//     capitalization: 'uppercase',
//     readable: true
//   })}-${randomstring.generate({
//     length: 10,
//     charset: 'alphanumeric',
//     capitalization: 'uppercase',
//     readable: true
//   })}`;

  

//   const existingApplication = await getApplicationByRef(ref);
//   console.log('existingApplication', existingApplication);

//   console.log('ref', ref);


//   if (existingApplication !== null) {
//     return generateUniqueReference();
//   } else {
//     return ref;
//   }

  
// }


const typeDefs = `
  extend type Query {
    hello: String
    # getApplicationById(id: ID!): Application
    # getApplications(orderBy: ApplicationOrderBy): [Application]
  }

  extend type Mutation {
    requestAccessToken(email: String!, seed: String!): String
    verifyAccessToken(email: String!, seed: String!, verificationCode: String!): AccessToken

    # updateApplication(id: ID!, slug: String!, locale: String!, localisedPageInput: LocalisedPageInput, schemaDefinitionInputs: [SchemaDefinitionInput], localisedFieldInputs: [LocalisedFieldInput], unlocalisedFieldInputs: [UnlocalisedFieldInput]): Application

    # deleteApplicationById(id: ID!): Application
    
  }

  


  type AccessToken {
    id: ID!
    email: String!
    seed: String!
    token: String!
    verificationCode: String!
    createdAt: Date!
    activatedAt: Date
    lastAccessedAt: Date
    deletedAt: Date
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


  AccessToken: {
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
    requestAccessToken: async (root, args, context, info) => {
      console.log('requestAccessToken', args);

      const sgMail = require('@sendgrid/mail');
      

      let current = Date.now();

      
      const email = args.email.trim();
      const seed = args.seed.trim();

      if (!_.isEmail(email)) {
        throw('The email address is invalid.');
      }

      if (_.isEmpty(seed)) {
        throw(`Seed cannot be empty.`);
      }


      const applications = await Application.find({"studentRecords.email": email});

      // console.log('applications', applications.length);

      if (applications.length === 0) {
        throw(`Cannot find any application belonging to ${email}.`);
      }

      const studentRecord = _.find(applications[0].studentRecords, {email});

      console.log('studentRecord:', studentRecord);

      

      const token = randomstring.generate({
          length: 64,
          readable: true,
          charset: 'abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@_-~.?*&^%#()'
        });

      const verificationCode = `${randomstring.generate({
          length: 3,
          charset: 'alphabetic',
          capitalization: 'uppercase',
          readable: true
        })}-${randomstring.generate({
          length: 3,
          charset: 'alphanumeric',
          capitalization: 'uppercase',
          readable: true
        })}-${randomstring.generate({
          length: 3,
          charset: 'alphanumeric',
          capitalization: 'uppercase',
          readable: true
        })}`;

      const accessToken = await AccessToken.create({
        createdAt: current,
        seed,
        email,
        token,
        verificationCode
      });

      const link = `${process.env.APP_URL}/registration/verify/${accessToken.verificationCode}/${accessToken.email.replace('@', '%40')}`;


      const msg = {
        from: "no-reply@ibcol.org",
        to: `${studentRecord.firstName} ${studentRecord.lastName} <${email}>`,
        subject: `IBCOL - Team Registration Login Verification (seed: "${seed}")`,
        text: `
        Hi ${studentRecord.firstName},
        We have received a login attempt with the following seed: 
        
        ====================================
        
        ${seed}
        
        ====================================


        To complete the login process, please click the button below:

        ${link}


        You can also enter the following verification code into the login form:

        ${verificationCode}
        


        
        International Blockchain Olympiad
        `,
        html: `<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <title> </title> <!--[if !mso]><!-- --> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!--<![endif]--> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <style type="text/css"> #outlook a { padding: 0; } .ReadMsgBody { width: 100%; } .ExternalClass { width: 100%; } .ExternalClass * { line-height: 100%; } body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; } img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; } p { display: block; margin: 13px 0; } </style> <!--[if !mso]><!--> <style type="text/css"> @media only screen and (max-width:480px) { @-ms-viewport { width: 320px; } @viewport { width: 320px; } } </style> <!--<![endif]--> <!--[if mso]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--> <!--[if lte mso 11]> <style type="text/css"> .outlook-group-fix { width:100% !important; } </style> <![endif]--> <style type="text/css"> @media only screen and (min-width:480px) { .mj-column-per-100 { width: 100% !important; max-width: 100%; } } </style> <style type="text/css"> @media only screen and (max-width:480px) { table.full-width-mobile { width: 100% !important; } td.full-width-mobile { width: auto !important; } } </style></head><body> <div style=""> <!--[if mso | IE]> <table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" > <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="Margin:0px auto;max-width:600px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"> <tbody> <tr> <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td class="" style="vertical-align:top;width:600px;" > <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"> <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"> <tbody> <tr> <td style="width:250px;"> <img height="auto" src="${process.env.APP_URL}/static/images/logo-international-blockchain-olympiad-(ibcol)-subpage.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;" width="250" /> </td> </tr> </tbody> </table> </td> </tr> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="40" style="vertical-align:top;height:40px;"> <![endif]--> <div style="height:40px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:16px;line-height:1;text-align:left;color:#000000;"> Hello <b>${studentRecord.firstName}</b>, </div> </td> </tr> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:16px;line-height:1;text-align:left;color:#000000;"> We have received a login attempt with the following seed: </div> </td> </tr> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" > <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="Margin:0px auto;max-width:600px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"> <tbody> <tr> <td style="direction:ltr;font-size:0px;padding:20px 0;padding-left:20px;padding-right:20px;text-align:center;vertical-align:top;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td class="" style="vertical-align:top;width:560px;" > <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"> <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eeeeee;vertical-align:top;" width="100%"> <tr> <td align="center" style="font-size:0px;padding:10px 25px;padding-top:18px;padding-bottom:15px;word-break:break-word;"> <div style="font-family:helvetica;font-size:20px;line-height:1;text-align:center;color:#000000;"> <b>${seed}</b> </div> </td> </tr> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="25" style="vertical-align:top;height:25px;"> <![endif]--> <div style="height:25px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" > <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="Margin:0px auto;max-width:600px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"> <tbody> <tr> <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td class="" style="vertical-align:top;width:600px;" > <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"> <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:16px;line-height:1;text-align:left;color:#000000;"> To complete the login process, please click the button below: </div> </td> </tr> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="25" style="vertical-align:top;height:25px;"> <![endif]--> <div style="height:25px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td align="center" vertical-align="middle" style="font-size:0px;padding:0;word-break:break-word;"> <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"> <tr> <td align="center" bgcolor="#000000" role="presentation" style="border:none;border-radius:10px;cursor:auto;padding:18px 80px;background:#000000;" valign="middle"> <a href="${link}" style="background:#000000;color:white;font-family:Helvetica;font-size:15px;font-weight:600;line-height:14px;Margin:0;text-decoration:none;text-transform:uppercase;" target="_blank"> Verify </a> </td> </tr> </table> </td> </tr> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="50" style="vertical-align:top;height:50px;"> <![endif]--> <div style="height:50px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:16px;line-height:1;text-align:left;color:#000000;"> You can also enter the following verification code into the login form: </div> </td> </tr> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="30" style="vertical-align:top;height:30px;"> <![endif]--> <div style="height:30px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:26px;line-height:1;text-align:center;color:#000000;"> <b>${verificationCode}</b> </div> </td> </tr> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="45" style="vertical-align:top;height:45px;"> <![endif]--> <div style="height:45px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:14px;line-height:1;text-align:left;color:#000000;"> International Blockchain Olympiad </div> </td> </tr> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" > <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="Margin:0px auto;max-width:600px;"> <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"> <tbody> <tr> <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td class="" style="vertical-align:top;width:600px;" > <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"> <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="15" style="vertical-align:top;height:15px;"> <![endif]--> <div style="height:15px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td style="font-size:0px;padding:10px 25px;word-break:break-word;"> <p style="border-top:solid 1px #666666;font-size:1;margin:0px auto;width:100%;"> </p> <!--[if mso | IE]> <table align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px #666666;font-size:1;margin:0px auto;width:550px;" role="presentation" width="550px" > <tr> <td style="height:0;line-height:0;"> &nbsp; </td> </tr> </table> <![endif]--> </td> </tr> <tr> <td style="font-size:0px;word-break:break-word;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="35" style="vertical-align:top;height:35px;"> <![endif]--> <div style="height:35px;"> &nbsp; </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> <tr> <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"> <div style="font-family:helvetica;font-size:12px;line-height:1;text-align:left;color:#6e6e6e;"> If you didn't attempt to log in or if the seed doesn't match, please ignore this email. </div> </td> </tr> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td> </tr> </table> <![endif]--> </div></body></html>`
      }



      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const sgResult = await sgMail.send(msg);
      
      return accessToken.email;

    },
    verifyAccessToken: async (root, args, context, info) => {
      console.log('verifyAccessToken', args);
      

      let current = Date.now();

      
      const email = args.email.trim();
      const seed = args.seed.trim();
      const verificationCode = args.verificationCode.trim();

      if (!_.isEmail(email)) {
        throw('The email address is invalid.');
      }

      if (_.isEmpty(seed)) {
        throw(`Seed cannot be empty.`);
      }

      if (_.isEmpty(verificationCode)) {
        throw(`Verification code cannot be empty.`);
      }

      const accessToken = await AccessToken.findOne({
        email,
        verificationCode,
        seed,
        activatedAt: undefined,
        deletedAt: undefined
      });

      // console.log('accessToken', accessToken);
      


      // const applications = await Application.find({"studentRecords.email": email});

      // // console.log('applications', applications.length);

      if (!accessToken) {
        throw(`Invalid verification code ${verificationCode}.`);
      }

      // mark access token as activated
      await AccessToken.updateOne({
        _id: accessToken._id,
        email,
        verificationCode,
        seed
      }, {activatedAt: current});

      // console.log('x', x);

      

      // const studentRecord = _.find(applications[0].studentRecords, {email});

      // console.log('studentRecord:', studentRecord);

      

      // const token = randomstring.generate({
      //     length: 64,
      //     readable: true,
      //     charset: 'abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@_-~.?*&^%#()'
      //   });

      // const verificationCode = `${randomstring.generate({
      //     length: 3,
      //     charset: 'alphabetic',
      //     capitalization: 'uppercase',
      //     readable: true
      //   })}-${randomstring.generate({
      //     length: 3,
      //     charset: 'alphanumeric',
      //     capitalization: 'uppercase',
      //     readable: true
      //   })}-${randomstring.generate({
      //     length: 3,
      //     charset: 'alphanumeric',
      //     capitalization: 'uppercase',
      //     readable: true
      //   })}`;

      // const accessToken = await AccessToken.create({
      //   createdAt: current,
      //   seed,
      //   email,
      //   token,
      //   verificationCode
      // });

      // const link = `${process.env.APP_URL}/registration/verify/${accessToken.verificationCode}/${accessToken.email.replace('@', '%40')}`;





      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      // const sgResult = await sgMail.send(msg);
      
      // return accessToken.email;

      return accessToken;

    }

  }
};

module.exports = {
  typeDefs,
  resolvers
};