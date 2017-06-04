import * as babylon from 'babylon';

console.log( babylon.parse( 'new graphql.GraphQLNonNull( graphql.GraphQLID )', { sourceType: 'module' }).program.body[0] );
