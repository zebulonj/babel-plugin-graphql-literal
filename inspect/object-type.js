import * as babylon from 'babylon';

console.log( babylon.parse( `new graphql.GraphQLObjectType({
  name: 'Character',
  fields: {
    id: {
      type: graphql.GraphQLID
    }
  }
})`, { sourceType: 'module' }).program.body[0].expression );
