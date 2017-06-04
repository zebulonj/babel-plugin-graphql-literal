import template from 'babel-template';
import * as t from 'babel-types';

import {
  parse,
  visit
} from 'graphql';

const typeIDTemplate = template( 'graphql.GraphQLID' );
const typeIntTemplate = template( 'graphql.GraphQLInt' );
const typeFloatTemplate = template( 'graphql.GraphQLFloat' );
const typeStringTemplate = template( 'graphql.GraphQLString' );

const typeNonNullTemplate = template( 'new graphql.GraphQLNonNull( TYPE )' );
const typeListTemplate = template( 'new graphql.GraphQLList( TYPE )' );

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
    case 'Int':
      return typeIntTemplate().expression;
    case 'Float':
      return typeFloatTemplate().expression;
    case 'String':
      return typeStringTemplate().expression;
    default:
      // TODO: Check whether the referenced type (identifier) is in scope?
      return t.identifier( type );
  }
};

const buildNonNullType = type => typeNonNullTemplate({
  TYPE: type
}).expression;

const buildListType = type => typeListTemplate({
  TYPE: type
}).expression;

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

const graphQLSchemaTemplate = template( `new graphql.GraphQLSchema( PARAMS )` );

const buildGraphQLSchema = params => graphQLSchemaTemplate({
  PARAMS: buildObjectExpression( params )
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

    SchemaDefinition: {
      enter() {
        push();
      },
      leave() {
        current = buildGraphQLSchema( current );
      }
    },

    OperationTypeDefinition: {
      enter() {
        console.log( "> [OperationTypeDefinition]" );
        push();
      },
      leave( node ) {
        const { type } = pop();
        console.log( "< [OperationTypeDefinition]", type, node );
        current[node.operation] = type;
      }
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

    NonNullType: {
      leave() {
        current.type = buildNonNullType( current.type )
      }
    },

    ListType: {
      leave() {
        current.type = buildListType( current.type )
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
