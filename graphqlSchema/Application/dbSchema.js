const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  teamName: String,
  studentRecords: Array,
  advisorRecords: {type: Array, default: []},
  projectRecords: {type: Array, default: []},
  verificationKeys: {type: Array, default: []},
  meta: {
    createdAt: Date,
    updatedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    deletedAt: Date
  }
});

const getModel = () => {
  if (mongoose.models.Application) {
    return mongoose.model('Application')
  } else {
    return mongoose.model('Application', schema, 'Applications');
  }
}

module.exports = getModel()