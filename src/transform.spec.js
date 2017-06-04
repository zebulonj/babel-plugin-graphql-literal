import test from 'tape';
import * as graphql from 'graphql';
import generate from 'babel-generator';

import transform from './transform';

test( "GraphQLObjectType...", assert => {
  assert.plan( 4 );

  const gql = `
    type Person {
      id: ID
      name: String
    }
  `;

  const js = generate( transform( gql ) ).code;
  const Person = eval( js );

  //console.log( `${ gql }\n${ js }` );
  //console.log( "Type Config:", Person._typeConfig );

  assert.ok( Person instanceof graphql.GraphQLObjectType, 'The fragment should evaluate to a GraphQLObjectType.' );
  assert.equal( Person._typeConfig.name, 'Person', 'The correct type name should be applied to the GraphQLObjectType.' );

  assert.ok( Person._typeConfig.fields['name'], 'The `name` field should be defined on the GraphQLObjectType.' );
  assert.equal( Person._typeConfig.fields.name.type.toString(), 'String', 'The correct type should be applied to the `name` field.' );
  assert.end();
});
