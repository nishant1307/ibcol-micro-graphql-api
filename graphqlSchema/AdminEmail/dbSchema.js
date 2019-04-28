const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  email: String,
  meta: {
    createdAt: Date,
    updatedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    deletedAt: Date
  }
});

const getModel = () => {
  if (mongoose.models.AdminEmail) {
    return mongoose.model('AdminEmail')
  } else {
    return mongoose.model('AdminEmail', schema, 'AdminEmails');
  }
}

module.exports = getModel()