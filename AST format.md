# Abstract Syntax Tree Format

This document specifies the core AST node types that support the Excel grammar. The format is based on the [ESTree AST](https://github.com/estree/estree) (and so is this document).

## Node objects

All AST nodes are represented by `Node` objects. They may have any prototype inheritance but implement the following basic interface:

```
interface Node {
  type: string;
  loc?: Location | null;
}
```

The `type` field is a string representing the AST variant type. Each subtype of Node is documented below with the specific string of its `type` field. You can use this field to determine which interface a node implements.

The `loc` field represents the source location information of the node. If the node contains no information about the source location, the field is `null`; otherwise it is an array consisting of a two numbers: A start offset (the position of the first character of the parsed source region) and an end offset (the position of the first character after the parsed source region):

```
interface Location extends Array<number> {
  0: number;
  1: number;
}
```

## Identifier

```
interface Identifier extends Node {
  type: "Identifier";
  name: string;
}
```

An identifier. These only appear on `CallExpression` and will always be a static string representing the name of a function call.

## ReferenceIdentifier

```
interface ReferenceIdentifier extends Node {
  type: "ReferenceIdentifier";
  value: string;
}
```

A range identifier.


## Literal

```
interface Literal extends Node {
  type: "Literal";
  raw: string;
  value: string | number | boolean;
}
```

A literal token. Captures numbers, strings, and booleans. Literal errors have their own variant type.

## ErrorLiteral

```
interface ErrorLiteral extends Node {
  type: "ErrorLiteral";
  raw: string;
  value: string;
}
```

An Error expression.

## UnaryExpression

```
interface UnaryExpression extends Node {
  type: "UnaryExpression";
  operator: UnaryOperator;
  arguments: Array<[ Node ]>;
}
```

A unary operator expression.

### UnaryOperator 

```
type UnaryOperator = (
  "+" | "-" | "%" | "#" | "@"
)
```

A unary operator token.

## BinaryExpression

```
interface BinaryExpression extends Node {
  type: "BinaryExpression";
  operator: BinaryOperator; 
  arguments: Array<[ Node, Node ]>;
}
```

A binary operator expression.

### BinaryOperator 

```
type BinaryOperator = (
  "=" | "<" | ">" | "<=" | ">=" |  "<>" |
  "-" | "+" | "*" | "/" | "^" |
  ":" | " " | "," |
  "&"
)
```

A binary operator token. Note that Excels union operator is whitespace so a parser must normalize this to a single space.

## CallExpression

```
interface CallExpression extends Node {
  type: "CallExpression";
  callee: Identifier;
  arguments: Array<Node>;
}
```

A function call expression.

## ArrayExpression

```
interface ArrayExpression extends Node {
  type: "ArrayExpression";
  elements: Array<Array<Literal | Error | ReferenceIdentifier>>;
}
```

An array expression. Excel does not have empty or sparse arrays and restricts array elements to literals. Google Sheets allows `ReferenceIdentifier`s as elements of arrays, the fx parser as an option for this but it is off by default.


