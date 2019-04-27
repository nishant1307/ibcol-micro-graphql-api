const _ = require('lodash');
const AccessToken = require('../graphqlSchema/AccessToken/dbSchema.js');

const isTokenValid = async ({email = "", token = ""}) => {
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
    

  return !_.isEmpty(accessToken);

}

module.exports = {isTokenValid};