const typeDefs = `

  union FieldValue = IntValue | FloatValue | StringValue | BooleanValue

  type IntValue {
    value: Int
  }

  type FloatValue {
    value: Float
  }

  type StringValue {
    value: String
  }

  type BooleanValue {
    value: Boolean
  }



  type Field {
    key: String!
    value: [Translatable]
  }
  
  type LocalisedField {
    key: String!
    value: String
  }

  input LocalisedFieldInput {
    key: String!
    value: String
  }


  type UnlocalisedField {
    key: String!
    value: String
  }

  input UnlocalisedFieldInput {
    key: String!
    value: String
  }



`;

const resolvers = {
  FieldValue: {
    __resolveType(obj, context, info) {
      //TODO: use FieldValue instead of casting everythign to String
      return "TODO";
    }
  }
};


module.exports = {
  typeDefs,
  
};