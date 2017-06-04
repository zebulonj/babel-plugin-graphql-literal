import test from 'tape';
import * as graphql from 'graphql';
import generate from 'babel-generator';

import transform from './transform';

test( "GraphQLObjectType...", sub => {
  sub.test( "...name.", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        name: String
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    //console.log( `${ gql }\n${ js }` );
    //console.log( "Type Config:", Person._typeConfig );

    assert.ok( Person instanceof graphql.GraphQLObjectType, 'The fragment should evaluate to a GraphQLObjectType.' );
    assert.equal( Person._typeConfig.name, 'Person', 'The correct type name should be applied to the GraphQLObjectType.' );
    assert.end();
  });

  sub.test( "...field: String", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        name: String
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    assert.ok( Person._typeConfig.fields['name'], 'The `name` field should be defined on the GraphQLObjectType.' );
    assert.equal( Person._typeConfig.fields.name.type.toString(), 'String', 'The correct type should be applied to the `name` field.' );
    assert.end();
  });

  sub.test( "...field: ID", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        id: ID
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    assert.ok( Person._typeConfig.fields['id'], 'The `id` field should be defined on the GraphQLObjectType.' );
    assert.equal( Person._typeConfig.fields.id.type.toString(), 'ID', 'The correct type should be applied to the `name` field.' );
    assert.end();
  });

  sub.test( "...field: Int", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        age: Int
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    assert.ok( Person._typeConfig.fields['age'], 'The `age` field should be defined on the GraphQLObjectType.' );
    assert.equal( Person._typeConfig.fields.age.type.toString(), 'Int', 'The correct type should be applied to the `name` field.' );
    assert.end();
  });

  sub.test( "...field: Float", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        height: Float
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    assert.ok( Person._typeConfig.fields['height'], 'The `height` field should be defined on the GraphQLObjectType.' );
    assert.equal( Person._typeConfig.fields.height.type.toString(), 'Float', 'The correct type should be applied to the `name` field.' );
    assert.end();
  });

  sub.test( "...field: Non-Null", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        id: ID!
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    assert.ok( Person._typeConfig.fields['id'], 'The `id` field should be defined on the GraphQLObjectType.' );
    assert.equal( Person._typeConfig.fields.id.type.toString(), 'ID!', 'The correct non-null wrapper should be applied to the `name` field.' );
    assert.end();
  });

  sub.test( "...field: List", assert => {
    assert.plan( 2 );

    const gql = `
      type Person {
        children: [String]
      }
    `;

    const js = generate( transform( gql ) ).code;
    const Person = eval( js );

    console.log( `${ gql }\n${ js }` );
    console.log( "Type Config:", Person._typeConfig );

    assert.ok( Person._typeConfig.fields['children'], 'The `children` field should be defined on the GraphQLObjectType.' );
    assert.equal( Person._typeConfig.fields.children.type.toString(), '[String]', 'The correct non-null wrapper should be applied to the `name` field.' );
    assert.end();
  });
});
