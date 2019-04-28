const _ = require('lodash');
const AccessToken = require('../graphqlSchema/AccessToken/dbSchema.js');
const AdminEmail = require('../graphqlSchema/AdminEmail/dbSchema.js');

const isTokenValid = async ({email = "", token = ""}, requireAdminAccess = false) => {
  let current = Date.now();
  // console.log('isTokenValid?', email, token);

  const accessToken = await AccessToken.findOneAndUpdate({
    email: email.toLowerCase(), token,
    deletedAt: {
      $exists: false
    },
    activatedAt: { 
      $exists : true,
      $ne: null
    }
  }, {
    $set: {
      lastAccessedAt: current
    }
  }, {new: true});

  // console.log('accessToken', accessToken, _.isEmpty(accessToken));

  const adminEmail = await AdminEmail.findOne({
    email: email.toLowerCase(),
    deletedAt: {
      $exists: false
    }
  });
    
  
  return !requireAdminAccess ? !_.isEmpty(accessToken) : !_.isEmpty(accessToken) && !_.isEmpty(adminEmail);

}

module.exports = {isTokenValid};