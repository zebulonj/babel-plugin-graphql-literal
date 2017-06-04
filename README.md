## Usage

```js
import * as graphql from 'graphql';

const Character = graphql`
  type Character {
    id: ID!
    name: String
  }
`;

const QueryRoot = graphql`
  type Query {
    characters: [Character]!
  }
`;

const schema = new graphql.GraphQLSchema({
  query: QueryRoot
});
```
