import template from 'babel-template';
import * as t from 'babel-types';

import {
  parse,
  visit
} from 'graphql';

const template_TypeInt = template( 'graphql.GraphQLInt' );
const template_TypeFloat = template( 'graphql.GraphQLFloat' );
const template_TypeString = template( 'graphql.GraphQLString' );
const template_TypeID = template( 'graphql.GraphQLID' );

const template_TypeNonNull = template( 'new graphql.GraphQLNonNull( TYPE )' );
const template_TypeList = template( 'new graphql.GraphQLList( TYPE )' );

const template_GraphQLObjectType = template(`
  new graphql.GraphQLObjectType({
    name: NAME,
    fields: FIELDS
  });
`);

const template_GraphQLInputObjectType = template(`
  new graphql.GraphQLInputObjectType({
    name: NAME,
    fields: FIELDS
  });
`);

const template_GraphQLSchema = template( `new graphql.GraphQLSchema( PARAMS )` );

const GraphQLSchema = operations => template_GraphQLSchema({ PARAMS: t.objectExpression( operations ) });

const GraphQLObjectType = ({ name = 'Object', fields = [] }) =>
  template_GraphQLObjectType({ NAME: t.stringLiteral( name ), FIELDS: t.objectExpression( fields ) });

const GraphQLInputObjectType = ({ name, fields = [] }) =>
  template_GraphQLInputObjectType({ NAME: t.stringLiteral( name ), FIELDS: t.objectExpression( fields ) });

const GraphQLType = type => {
  switch ( type ) {
    case 'Int':
      return template_TypeInt().expression;
    case 'Float':
      return template_TypeFloat().expression;
    case 'String':
      return template_TypeString().expression;
    case 'ID':
      return template_TypeID().expression;
    default:
      // TODO: Check whether the referenced type (identifier) is in scope?
      return t.identifier( type );
  }
};

const GraphQLNonNull = type => template_TypeNonNull({ TYPE: type }).expression;
const GraphQLList = type => template_TypeList({ TYPE: type }).expression;

const GraphQLField = ({ name, ...props }) =>
  t.objectProperty( t.identifier( name ), t.objectExpression( Object.keys( props ).map( key => t.objectProperty( t.identifier( key ), props[key] ) ) ) );

const GraphQLInputValueDefinition = ({ name, ...props }) =>
  t.objectProperty( t.identifier( name ), t.objectExpression( Object.keys( props ).map( key => t.objectProperty( t.identifier( key ), props[key] ) ) ) );

const GraphQLOperation = ({ name, type }) =>
  t.objectProperty( t.identifier( name ), type );

export function transform( ast ) {
  let context;

  visit( ast, {
    enter() {
      //console.log( `- [${ node.kind }]`, node );
      return false;
    },

    SchemaDefinition: {
      enter( node ) {
        const { operationTypes } = node;
        context = GraphQLSchema( operationTypes.map( operation => transform( operation ) ) );

        return false;
      }
    },

    OperationTypeDefinition: {
      enter( node ) {
        const { operation, type } = node;
        context = GraphQLOperation({
          name: operation,
          type: transform( type )
        });

        return false;
      }
    },

    ObjectTypeDefinition: {
      enter( node ) {
        const { name, fields } = node;
        context = GraphQLObjectType({
          name: transform( name ),
          fields: fields.map( field => transform( field ) )
        });

        return false;
      }
    },

    InputObjectTypeDefinition: {
      enter( node ) {
        const { name, fields } = node;
        context = GraphQLInputObjectType({
          name: transform( name ),
          fields: fields.map( field => transform( field ) )
        })

        return false;
      }
    },

    FieldDefinition: {
      enter( node ) {
        const { name, type, arguments: args } = node;
        context = GraphQLField({
          name: transform( name ),
          type: transform( type ),
          args: t.objectExpression( ( args || [] ).map( arg => transform( arg ) ) )
        });

        return false;
      }
    },

    InputValueDefinition: {
      enter( node ) {
        const { name, type } = node;
        context = GraphQLInputValueDefinition({
          name: transform( name ),
          type: transform( type )
        })

        return false;
      }
    },

    NonNullType: {
      leave() {
        context = GraphQLNonNull( context );
      }
    },

    ListType: {
      leave() {
        context = GraphQLList( context );
      }
    },

    NamedType: {
      leave() {
        context = GraphQLType( context );
      }
    },

    Name: {
      enter( node ) {
        context = node.value;

        return false;
      }
    }
  });

  return context;
}

export default function transformGraphQL( doc ) {
  // TODO: Throw an error if more than one string is received.
  const ast = parse( doc );
  if ( ast.definitions.length !== 1 ) throw new Error( 'GraphQL literals must contain a single definition.' );

  const def = ast.definitions[0];

  return transform( def );
}
