import template from 'babel-template';
import * as t from 'babel-types';

import {
  parse,
  visit
} from 'graphql';

const typeNonNullIDTemplate = template( 'new graphql.GraphQLNonNull( TYPE )' );
const typeIDTemplate = template( 'graphql.GraphQLID' );
const typeStringTemplate = template( 'graphql.GraphQLString' );

const buildObjectExpression = propertiesMap => t.objectExpression(
  Object.keys( propertiesMap ).map( key => t.objectProperty( t.identifier( key ), propertiesMap[key] ) )
);

const buildGraphQLFields = ( fields ) => t.objectExpression(
  fields.map( ({ name, type }) => t.objectProperty( t.identifier( name ), buildObjectExpression({ type }) ) )
);

const buildGraphQLType = type => {
  switch ( type ) {
    case 'ID':
      return typeIDTemplate().expression;
    case 'String':
      return typeStringTemplate().expression;
    default:
      console.log( "No type mapped for:", type );
      return typeNonNullIDTemplate().expression;
  }
};

const graphQLObjectTypeTemplate = template(`
  new graphql.GraphQLObjectType({
    name: NAME,
    fields: FIELDS
  });
`);

const buildGraphQLObjectType = ({
  name = 'Object',
  fields = []
}) => graphQLObjectTypeTemplate({
  NAME: t.stringLiteral( name ),
  FIELDS: buildGraphQLFields( fields )
});

export default function transformGraphQL( doc ) {
  // TODO: Throw an error if more than one string is received.
  const ast = parse( doc );
  if ( ast.definitions.length !== 1 ) throw new Error( 'GraphQL literals must contain a single definition.' );

  const def = ast.definitions[0];

  const context = [];
  let current;

  function push( next = {} ) {
    context.push( current );

    return current = next;
  }

  function pop() {
    const last = current;
    current = context.pop();

    return last;
  }

  visit( def, {
    enter( node ) {
      console.log( node );
    },

    ObjectTypeDefinition: {
      enter() {
        current = {
          name: 'Goober',
          fields: []
        };
      },
      leave() {
        //current = new GraphQLObjectType( current );
        current = buildGraphQLObjectType( current );
      }
    },

    FieldDefinition: {
      enter( node ) {
        console.log( '> [FieldDefinition]', node );
        push();
      },
      leave() {
        console.log( '< [FieldDefinition]' );
        const { name, type } = current;

        pop();
        current.fields.push({ name, type })
      }
    },

    NamedType: {
      enter( node ) {
        console.log( '> [NamedType]', node );
        push();
      },
      leave() {
        console.log( '< [NamedType]' );
        const { name } = pop();
        current.type = buildGraphQLType( name );
      }
    },

    Name: {
      leave( node ) {
        console.log( '[Name]', node );
        current.name = node.value;
      }
    }
  });

  return current;
}
