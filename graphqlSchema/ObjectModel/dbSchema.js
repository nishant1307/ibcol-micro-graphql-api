const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  name: String,
  schemaDefinitions: Array,
  meta: {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date
  }
});

const getModel = () => {
  if (mongoose.models.ObjectModel) {
    return mongoose.model('ObjectModel')
  } else {
    return mongoose.model('ObjectModel', schema, 'ObjectModels');
  }
}

module.exports = getModel()