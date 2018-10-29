const typeDefs = `

  #extend type Query {
  #  getTranslation(locale: String!, translatable: Translatable!): String
  #}

  type Translatable {
    locale: String!
    translation: String
  }
  

`;

const resolvers = {

};

module.exports = {
  typeDefs,
  resolvers
};


module.exports = {typeDefs, resolvers};