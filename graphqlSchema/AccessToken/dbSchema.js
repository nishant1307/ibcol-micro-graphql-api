const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  email: String,
  seed: String,
  token: String,
  verificationCode: String,
  createdAt: Date,
  activatedAt: {type: Date, default: undefined},
  lastAccessedAt: {type: Date, default: undefined},
  deletedAt: {type: Date, default: undefined}
});

const getModel = () => {
  if (mongoose.models.AccessToken) {
    return mongoose.model('AccessToken')
  } else {
    return mongoose.model('AccessToken', schema, 'AccessTokens');
  }
}

module.exports = getModel()