import transform from './transform';

export default function() {
  return {
    visitor: {
      TaggedTemplateExpression( path ) {
        const { tag, quasi } = path.node;
        if ( tag.name === 'graphql' ) {
          const doc = quasi.quasis.map( node => node.value.cooked ).join();

          path.replaceWith( transform( doc ) );
        }
      }
    }
  };
}
