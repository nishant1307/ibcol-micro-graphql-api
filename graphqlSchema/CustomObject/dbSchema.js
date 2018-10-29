const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  model: String,
  label: String,
  customOrder: Number,
  fields: Array,
  unlocalisedFields: {type: Array, default: []},
  meta: {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date
  }
});

const getModel = () => {
  if (mongoose.models.CustomObject) {
    return mongoose.model('CustomObject')
  } else {
    return mongoose.model('CustomObject', schema, 'CustomObjects');
  }
}

module.exports = getModel()