const mongoose = require('mongoose');

var schema = new mongoose.Schema({
  title: Array,
  slug: String,
  fields: Array,
  unlocalisedFields: {type: Array, default: []},
  schemaDefinitions: Array,
  seo: {
    title: Array,
    description: Array,
    tags: Array,
    image: Array
  },
  meta: {
    createdAt: Date,
    updatedAt: Date,
    publishAt: Date,
    unpublishAt: Date,
    deletedAt: Date
  }
});

const getModel = () => {
  if (mongoose.models.Page) {
    return mongoose.model('Page')
  } else {
    return mongoose.model('Page', schema, 'Pages');
  }
}

module.exports = getModel()

//mongoose.model('Page', schema, 'Pages');