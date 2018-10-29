const typeDefs = `
  enum FieldType {
    HTML,
    TEXT,
    TEXTAREA,
    INTEGER,
    FLOAT,
    FILE,
    IMAGE,
    BOOLEAN
  }
  
  type SchemaDefinition {
    key: String!
    type: FieldType!
    unlocalised: Boolean 
  }

  input SchemaDefinitionInput {
    key: String!
    type: FieldType!
    unlocalised: Boolean
  }
  

`;


module.exports = {
  typeDefs
};