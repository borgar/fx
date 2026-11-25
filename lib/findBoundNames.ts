import { CONTEXT, FUNCTION, NEWLINE, OPERATOR, REF_NAMED, WHITESPACE } from './constants.ts';
import type { Token } from './types.ts';

const reLetLambda = /^l(?:ambda|et)$/i;

type Scope = {
  // LET or LAMBDA, or null for any other paren or array brace
  binder: 'let' | 'lambda' | null,
  // index of the current argument
  argIndex: number,
  // the argument so far is a single name token
  argName: string | null,
  // number of non-whitespace tokens in the current argument
  argTokens: number,
  // a LET name waiting for its value to end before it is visible
  pendingName: string | null,
  // lowercase names bound by this call that are visible at this point
  names: string[]
};

// Finds name tokens that refer to a LET or LAMBDA parameter, so they don't get merged into a
// 3D reference: in `LET(foo,1,foo:Mar!A1)`, "foo" is the parameter, not the first sheet of
// "foo:Mar".
export function findBoundNames (tokens: Token[]): Set<Token> {
  const bound = new Set<Token>();
  const stack: Scope[] = [];
  let lastToken: Token | undefined;
  const isVisible = (name: string) => {
    for (const scope of stack) {
      if (scope.names.includes(name)) {
        return true;
      }
    }
    return false;
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let tokenType = token.type;
    if (tokenType === WHITESPACE || tokenType === NEWLINE) {
      continue;
    }
    // A lone "r" or "c" before ":" is lexed as a sheet name because it isn't a valid
    // name on its own. If it is a parameter in scope, it is the parameter instead.
    if (
      tokenType === CONTEXT &&
      tokens[i + 1]?.type === OPERATOR && tokens[i + 1].value === ':' &&
      isVisible(token.value.toLowerCase())
    ) {
      token.type = REF_NAMED;
      tokenType = REF_NAMED;
    }
    const scope = stack.at(-1);
    if (tokenType === OPERATOR && (token.value === '(' || token.value === '{')) {
      if (scope) {
        scope.argTokens++;
      }
      const isBinder = token.value === '(' && lastToken?.type === FUNCTION && reLetLambda.test(lastToken.value);
      stack.push({
        binder: isBinder ? (/^let$/i.test(lastToken.value) ? 'let' : 'lambda') : null,
        argIndex: 0,
        argName: null,
        argTokens: 0,
        pendingName: null,
        names: []
      });
    }
    else if (tokenType === OPERATOR && (token.value === ')' || token.value === '}')) {
      stack.pop();
    }
    else if (scope && tokenType === OPERATOR && token.value === ',') {
      if (scope.binder) {
        const name = scope.argTokens === 1 ? scope.argName : null;
        if (scope.binder === 'lambda') {
          if (name) {
            scope.names.push(name);
          }
        }
        else if (scope.argIndex % 2 === 0) {
          scope.pendingName = name;
        }
        else if (scope.pendingName) {
          scope.names.push(scope.pendingName);
          scope.pendingName = null;
        }
      }
      scope.argIndex++;
      scope.argName = null;
      scope.argTokens = 0;
    }
    else {
      if (scope) {
        scope.argTokens++;
        scope.argName = tokenType === REF_NAMED ? token.value.toLowerCase() : null;
      }
      if (tokenType === REF_NAMED && isVisible(token.value.toLowerCase())) {
        bound.add(token);
      }
    }
    lastToken = token;
  }
  return bound;
}
