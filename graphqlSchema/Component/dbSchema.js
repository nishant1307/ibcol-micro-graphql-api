const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  name: String,
  fields: Array,
  unlocalisedFields: {type: Array, default: []},
  schemaDefinitions: Array,
  meta: {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date
  }
});

const getModel = () => {
  if (mongoose.models.Component) {
    return mongoose.model('Component')
  } else {
    return mongoose.model('Component', schema, 'Components');
  }
}

module.exports = getModel()