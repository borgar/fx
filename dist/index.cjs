var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/index.js
var index_exports = {};
__export(index_exports, {
  MAX_COLS: () => MAX_COLS,
  MAX_ROWS: () => MAX_ROWS,
  addA1RangeBounds: () => addA1RangeBounds,
  addTokenMeta: () => addTokenMeta,
  fixRanges: () => fixRanges,
  fromCol: () => fromCol,
  isError: () => isError,
  isFunction: () => isFunction,
  isFxPrefix: () => isFxPrefix,
  isLiteral: () => isLiteral,
  isOperator: () => isOperator,
  isRange: () => isRange,
  isReference: () => isReference,
  isWhitespace: () => isWhitespace,
  mergeRefTokens: () => mergeRefTokens,
  nodeTypes: () => nodeTypes,
  parse: () => parse,
  parseA1Ref: () => parseA1Ref,
  parseR1C1Ref: () => parseR1C1Ref,
  parseStructRef: () => parseStructRef,
  stringifyA1Ref: () => stringifyA1Ref,
  stringifyR1C1Ref: () => stringifyR1C1Ref,
  stringifyStructRef: () => stringifyStructRef,
  toCol: () => toCol,
  tokenTypes: () => tokenTypes,
  tokenize: () => tokenize,
  translateToA1: () => translateToA1,
  translateToR1C1: () => translateToR1C1
});
module.exports = __toCommonJS(index_exports);

// lib/constants.js
var OPERATOR = "operator";
var OPERATOR_TRIM = "operator-trim";
var BOOLEAN = "bool";
var ERROR = "error";
var NUMBER = "number";
var FUNCTION = "func";
var NEWLINE = "newline";
var WHITESPACE = "whitespace";
var STRING = "string";
var CONTEXT_QUOTE = "context_quote";
var CONTEXT = "context";
var REF_RANGE = "range";
var REF_BEAM = "range_beam";
var REF_TERNARY = "range_ternary";
var REF_NAMED = "range_named";
var REF_STRUCT = "structured";
var FX_PREFIX = "fx_prefix";
var UNKNOWN = "unknown";
var UNARY = "UnaryExpression";
var BINARY = "BinaryExpression";
var REFERENCE = "ReferenceIdentifier";
var LITERAL = "Literal";
var ERROR_LITERAL = "ErrorLiteral";
var CALL = "CallExpression";
var LAMBDA = "LambdaExpression";
var LET = "LetExpression";
var ARRAY = "ArrayExpression";
var IDENTIFIER = "Identifier";
var LET_DECL = "LetDeclarator";
var MAX_COLS = 2 ** 14 - 1;
var MAX_ROWS = 2 ** 20 - 1;

// lib/mergeRefTokens.js
var END = "$";
var validRunsMerge = [
  [REF_RANGE, ":", REF_RANGE],
  [REF_RANGE, ".:", REF_RANGE],
  [REF_RANGE, ":.", REF_RANGE],
  [REF_RANGE, ".:.", REF_RANGE],
  [REF_RANGE],
  [REF_BEAM],
  [REF_TERNARY],
  [CONTEXT, "!", REF_RANGE, ":", REF_RANGE],
  [CONTEXT, "!", REF_RANGE, ".:", REF_RANGE],
  [CONTEXT, "!", REF_RANGE, ":.", REF_RANGE],
  [CONTEXT, "!", REF_RANGE, ".:.", REF_RANGE],
  [CONTEXT, "!", REF_RANGE],
  [CONTEXT, "!", REF_BEAM],
  [CONTEXT, "!", REF_TERNARY],
  [CONTEXT_QUOTE, "!", REF_RANGE, ":", REF_RANGE],
  [CONTEXT_QUOTE, "!", REF_RANGE, ".:", REF_RANGE],
  [CONTEXT_QUOTE, "!", REF_RANGE, ":.", REF_RANGE],
  [CONTEXT_QUOTE, "!", REF_RANGE, ".:.", REF_RANGE],
  [CONTEXT_QUOTE, "!", REF_RANGE],
  [CONTEXT_QUOTE, "!", REF_BEAM],
  [CONTEXT_QUOTE, "!", REF_TERNARY],
  [REF_NAMED],
  [CONTEXT, "!", REF_NAMED],
  [CONTEXT_QUOTE, "!", REF_NAMED],
  [REF_STRUCT],
  [REF_NAMED, REF_STRUCT],
  [CONTEXT, "!", REF_NAMED, REF_STRUCT],
  [CONTEXT_QUOTE, "!", REF_NAMED, REF_STRUCT]
];
var refPartsTree = {};
function packList(f, node) {
  if (f.length) {
    const key = f[0];
    node[key] = node[key] || {};
    packList(f.slice(1), node[key]);
  } else {
    node[END] = true;
  }
}
validRunsMerge.forEach((run) => packList(run.concat().reverse(), refPartsTree));
var matcher = (tokens2, currNode, anchorIndex, index = 0) => {
  let i = index;
  let node = currNode;
  const max = tokens2.length - index;
  while (i <= max) {
    const token = tokens2[anchorIndex - i];
    if (token) {
      const key = token.type === OPERATOR ? token.value : token.type;
      if (key in node) {
        node = node[key];
        i += 1;
        continue;
      }
    }
    return node[END] ? i : 0;
  }
};
function mergeRefTokens(tokenlist) {
  const finalTokens = [];
  for (let i = tokenlist.length - 1; i >= 0; i--) {
    let token = tokenlist[i];
    const type = token.type;
    if (type === REF_RANGE || type === REF_BEAM || type === REF_TERNARY || type === REF_NAMED || type === REF_STRUCT) {
      const valid = matcher(tokenlist, refPartsTree, i);
      if (valid > 1) {
        token = { ...token, value: "" };
        const start = i - valid + 1;
        for (let j = start; j <= i; j++) {
          token.value += tokenlist[j].value;
        }
        if (token.loc && tokenlist[start].loc) {
          token.loc[0] = tokenlist[start].loc[0];
        }
        i -= valid - 1;
      }
    }
    finalTokens[finalTokens.length] = token;
  }
  return finalTokens.reverse();
}

// lib/lexers/lexError.js
var re_ERROR = /#(?:NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/iy;
var HASH = 35;
function lexError(str, pos) {
  if (str.charCodeAt(pos) === HASH) {
    re_ERROR.lastIndex = pos;
    const m = re_ERROR.exec(str);
    if (m) {
      return { type: ERROR, value: m[0] };
    }
  }
}

// lib/lexers/lexRangeTrim.js
var PERIOD = 46;
var COLON = 58;
function lexRangeTrim(str, pos) {
  const c0 = str.charCodeAt(pos);
  if (c0 === PERIOD || c0 === COLON) {
    const c1 = str.charCodeAt(pos + 1);
    if (c0 !== c1) {
      if (c1 === COLON) {
        return {
          type: OPERATOR_TRIM,
          value: str.slice(pos, pos + (str.charCodeAt(pos + 2) === PERIOD ? 3 : 2))
        };
      } else if (c1 === PERIOD) {
        return {
          type: OPERATOR_TRIM,
          value: str.slice(pos, pos + 2)
        };
      }
    }
  }
}

// lib/lexers/lexOperator.js
function lexOperator(str, pos) {
  const c0 = str.charCodeAt(pos);
  const c1 = str.charCodeAt(pos + 1);
  if (c0 === 60 && c1 === 61 || // <=
  c0 === 62 && c1 === 61 || // >=
  c0 === 60 && c1 === 62) {
    return { type: OPERATOR, value: str.slice(pos, pos + 2) };
  }
  if (
    // { } ! # % &
    c0 === 123 || c0 === 125 || c0 === 33 || c0 === 35 || c0 === 37 || c0 === 38 || // ( ) * + , -
    c0 === 40 || c0 === 41 || c0 === 42 || c0 === 43 || c0 === 44 || c0 === 45 || // / : ; < = >
    c0 === 47 || c0 === 58 || c0 === 59 || c0 === 60 || c0 === 61 || c0 === 62 || // @ ^
    c0 === 64 || c0 === 94
  ) {
    return { type: OPERATOR, value: str[pos] };
  }
}

// lib/lexers/lexFunction.js
var PAREN_OPEN = 40;
function lexFunction(str, pos) {
  const start = pos;
  let c = str.charCodeAt(pos);
  if ((c < 65 || c > 90) && // A-Z
  (c < 97 || c > 122) && // a-z
  c !== 95) {
    return;
  }
  pos++;
  do {
    c = str.charCodeAt(pos);
    if ((c < 65 || c > 90) && // A-Z
    (c < 97 || c > 122) && // a-z
    (c < 48 || c > 57) && // 0-9
    c !== 95 && // _
    c !== 46) {
      break;
    }
    pos++;
  } while (pos < str.length);
  if (str.charCodeAt(pos) === PAREN_OPEN) {
    return { type: FUNCTION, value: str.slice(start, pos) };
  }
}

// lib/lexers/lexBoolean.js
function lexBoolean(str, pos) {
  const c0 = str.charCodeAt(pos);
  if (c0 === 84 || c0 === 116) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === 82 || c1 === 114) {
      const c2 = str.charCodeAt(pos + 2);
      if (c2 === 85 || c2 === 117) {
        const c3 = str.charCodeAt(pos + 3);
        if (c3 === 69 || c3 === 101) {
          return { type: BOOLEAN, value: str.slice(pos, pos + 4) };
        }
      }
    }
  }
  if (c0 === 70 || c0 === 102) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === 65 || c1 === 97) {
      const c2 = str.charCodeAt(pos + 2);
      if (c2 === 76 || c2 === 108) {
        const c3 = str.charCodeAt(pos + 3);
        if (c3 === 83 || c3 === 115) {
          const c4 = str.charCodeAt(pos + 4);
          if (c4 === 69 || c4 === 101) {
            return { type: BOOLEAN, value: str.slice(pos, pos + 5) };
          }
        }
      }
    }
  }
}

// lib/lexers/lexNewLine.js
function lexNewLine(str, pos) {
  const start = pos;
  while (str.charCodeAt(pos) === 10) {
    pos++;
  }
  if (pos !== start) {
    return { type: NEWLINE, value: str.slice(start, pos) };
  }
}

// lib/lexers/lexWhitespace.js
function isWS(c) {
  return c === 9 || c === 11 || c === 12 || c === 13 || c === 32 || c === 160 || c === 5760 || c === 8232 || c === 8233 || c === 8239 || c === 8287 || c === 12288 || c === 65279 || c >= 8192 && c <= 8202;
}
function lexWhitespace(str, pos) {
  const start = pos;
  while (isWS(str.charCodeAt(pos))) {
    pos++;
  }
  if (pos !== start) {
    return { type: WHITESPACE, value: str.slice(start, pos) };
  }
}

// lib/lexers/lexString.js
var QUOT = 34;
function lexString(str, pos) {
  const start = pos;
  if (str.charCodeAt(pos) === QUOT) {
    pos++;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === QUOT) {
        pos++;
        if (str.charCodeAt(pos) !== QUOT) {
          return { type: STRING, value: str.slice(start, pos) };
        }
      }
      pos++;
    }
    return { type: STRING, value: str.slice(start, pos), unterminated: true };
  }
}

// lib/lexers/lexContext.js
var QUOT_SINGLE = 39;
var BR_OPEN = 91;
var BR_CLOSE = 93;
var EXCL = 33;
function lexContext(str, pos, options) {
  const c0 = str.charCodeAt(pos);
  let br1;
  let br2;
  if (c0 === QUOT_SINGLE) {
    const start = pos;
    pos++;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === BR_OPEN) {
        if (br1) {
          return;
        }
        br1 = pos;
      } else if (c === BR_CLOSE) {
        if (br2) {
          return;
        }
        br2 = pos;
      } else if (c === QUOT_SINGLE) {
        pos++;
        if (str.charCodeAt(pos) !== QUOT_SINGLE) {
          let valid = br1 == null && br2 == null;
          if (options.xlsx && br1 === start + 1 && br2 === pos - 2) {
            valid = true;
          }
          if (br1 >= start + 1 && br2 < pos - 2 && br2 > br1 + 1) {
            valid = true;
          }
          if (valid && str.charCodeAt(pos) === EXCL) {
            return { type: CONTEXT_QUOTE, value: str.slice(start, pos) };
          }
          return;
        }
      }
      pos++;
    }
  } else if (c0 !== EXCL) {
    const start = pos;
    while (pos < str.length) {
      const c = str.charCodeAt(pos);
      if (c === BR_OPEN) {
        if (br1) {
          return;
        }
        br1 = pos;
      } else if (c === BR_CLOSE) {
        if (br2) {
          return;
        }
        br2 = pos;
      } else if (c === EXCL) {
        let valid = br1 == null && br2 == null;
        if (options.xlsx && br1 === start && br2 === pos - 1) {
          valid = true;
        }
        if (br1 >= start && br2 < pos - 1 && br2 > br1 + 1) {
          valid = true;
        }
        if (valid) {
          return { type: CONTEXT, value: str.slice(start, pos) };
        }
      } else if ((br1 == null || br2 != null) && // [0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]
      !(c >= 65 && c <= 90 || // A-Z
      c >= 97 && c <= 122 || // a-z
      c >= 48 && c <= 57 || // 0-9
      c === 46 || // .
      c === 95 || // _
      c === 161 || // ¡
      c === 164 || // ¤
      c === 167 || // §
      c === 168 || // ¨
      c === 170 || // ª
      c === 173 || // \u00ad
      c >= 175)) {
        return;
      }
      pos++;
    }
  }
}

// lib/lexers/advRangeOp.js
var PERIOD2 = 46;
var COLON2 = 58;
function advRangeOp(str, pos) {
  const c0 = str.charCodeAt(pos);
  if (c0 === PERIOD2) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === COLON2) {
      return str.charCodeAt(pos + 2) === PERIOD2 ? 3 : 2;
    }
  } else if (c0 === COLON2) {
    const c1 = str.charCodeAt(pos + 1);
    return c1 === PERIOD2 ? 2 : 1;
  }
  return 0;
}

// lib/lexers/canEndRange.js
function canEndRange(str, pos) {
  const c = str.charCodeAt(pos);
  return !(c >= 65 && c <= 90 || // A-Z
  c >= 97 && c <= 122 || // a-z
  c >= 48 && c <= 57 || // 0-9
  c === 95 || // _
  c > 160);
}
function canEndPartialRange(str, pos) {
  const c = str.charCodeAt(pos);
  return !(c >= 65 && c <= 90 || // A-Z
  c >= 97 && c <= 122 || // a-z
  c >= 48 && c <= 57 || // 0-9
  c === 95 || // _
  c === 40 || // (
  c === 36 || // $
  c === 46);
}

// lib/lexers/lexRangeA1.js
function advA1Col(str, pos) {
  const start = pos;
  if (str.charCodeAt(pos) === 36) {
    pos++;
  }
  const stop = pos + 3;
  let col = 0;
  do {
    const c = str.charCodeAt(pos);
    if (c >= 65 && c <= 90) {
      col = 26 * col + c - 64;
      pos++;
    } else if (c >= 97 && c <= 122) {
      col = 26 * col + c - 96;
      pos++;
    } else {
      break;
    }
  } while (pos < stop && pos < str.length);
  return col && col <= MAX_COLS + 1 ? pos - start : 0;
}
function advA1Row(str, pos) {
  const start = pos;
  if (str.charCodeAt(pos) === 36) {
    pos++;
  }
  const stop = pos + 7;
  let row = 0;
  let c = str.charCodeAt(pos);
  if (c >= 49 && c <= 57) {
    row = row * 10 + c - 48;
    pos++;
    do {
      c = str.charCodeAt(pos);
      if (c >= 48 && c <= 57) {
        row = row * 10 + c - 48;
        pos++;
      } else {
        break;
      }
    } while (pos < stop && pos < str.length);
  }
  return row && row <= MAX_ROWS + 1 ? pos - start : 0;
}
function lexRangeA1(str, pos, options) {
  let p = pos;
  const left = advA1Col(str, p);
  let right = 0;
  let bottom = 0;
  if (left) {
    p += left;
    const top = advA1Row(str, p);
    p += top;
    const op = advRangeOp(str, p);
    const preOp = p;
    if (op) {
      p += op;
      right = advA1Col(str, p);
      p += right;
      bottom = advA1Row(str, p);
      p += bottom;
      if (top && bottom && right) {
        if (canEndRange(str, p) && options.mergeRefs) {
          return { type: REF_RANGE, value: str.slice(pos, p) };
        }
      } else if (!top && !bottom) {
        if (canEndRange(str, p)) {
          return { type: REF_BEAM, value: str.slice(pos, p) };
        }
      } else if (options.allowTernary && (bottom || right)) {
        if (canEndPartialRange(str, p)) {
          return { type: REF_TERNARY, value: str.slice(pos, p) };
        }
      }
    }
    if (top && canEndRange(str, preOp)) {
      return { type: REF_RANGE, value: str.slice(pos, preOp) };
    }
  } else {
    const top = advA1Row(str, p);
    if (top) {
      p += top;
      const op = advRangeOp(str, p);
      if (op) {
        p += op;
        right = advA1Col(str, p);
        if (right) {
          p += right;
        }
        bottom = advA1Row(str, p);
        p += bottom;
        if (right && bottom && options.allowTernary) {
          if (canEndPartialRange(str, p)) {
            return { type: REF_TERNARY, value: str.slice(pos, p) };
          }
        }
        if (!right && bottom) {
          if (canEndRange(str, p)) {
            return { type: REF_BEAM, value: str.slice(pos, p) };
          }
        }
      }
    }
  }
}

// lib/lexers/lexRangeR1C1.js
var BR_OPEN2 = 91;
var BR_CLOSE2 = 93;
var UC_R = 82;
var LC_R = 114;
var UC_C = 67;
var LC_C = 99;
var PLUS = 43;
var MINUS = 45;
function lexR1C1Part(str, pos, isRow = false) {
  const start = pos;
  const c0 = str.charCodeAt(pos);
  if (isRow ? c0 === UC_R || c0 === LC_R : c0 === UC_C || c0 === LC_C) {
    pos++;
    let digits = 0;
    let value = 0;
    let stop = str.length;
    const c1 = str.charCodeAt(pos);
    let c;
    let sign = 1;
    const relative = c1 === BR_OPEN2;
    if (relative) {
      stop = Math.min(stop, pos + (isRow ? 8 : 6));
      pos++;
      c = str.charCodeAt(pos);
      if (c === PLUS || c === MINUS) {
        pos++;
        stop++;
        sign = c === MINUS ? -1 : 1;
      }
    } else if (c1 < 49 || c1 > 57 || isNaN(c1)) {
      return 1;
    }
    do {
      const c2 = str.charCodeAt(pos);
      if (c2 >= 48 && c2 <= 57) {
        value = value * 10 + c2 - 48;
        digits++;
        pos++;
      } else {
        break;
      }
    } while (pos < stop);
    const MAX = isRow ? MAX_ROWS : MAX_COLS;
    if (relative) {
      const c2 = str.charCodeAt(pos);
      if (c2 !== BR_CLOSE2) {
        return 0;
      }
      pos++;
      value *= sign;
      return digits && -MAX <= value && value <= MAX ? pos - start : 0;
    }
    return digits && value <= MAX + 1 ? pos - start : 0;
  }
  return 0;
}
function lexRangeR1C1(str, pos, options) {
  let p = pos;
  const r1 = lexR1C1Part(str, p, true);
  p += r1;
  const c1 = lexR1C1Part(str, p);
  p += c1;
  if (c1 || r1) {
    const op = advRangeOp(str, p);
    const preOp = p;
    if (op) {
      p += op;
      const r2 = lexR1C1Part(str, p, true);
      p += r2;
      const c2 = lexR1C1Part(str, p);
      p += c2;
      if (r1 && !c1 && r2 && c2 || !r1 && c1 && r2 && c2 || r1 && c1 && r2 && !c2 || r1 && c1 && !r2 && c2) {
        if (options.allowTernary && canEndRange(str, p)) {
          return { type: REF_TERNARY, value: str.slice(pos, p) };
        }
      } else if (c1 && c2 && !r1 && !r2 || !c1 && !c2 && r1 && r2) {
        if (canEndRange(str, p)) {
          return { type: REF_BEAM, value: str.slice(pos, p) };
        }
      }
    }
    if (canEndRange(str, preOp)) {
      return {
        type: r1 && c1 ? REF_RANGE : REF_BEAM,
        value: str.slice(pos, preOp)
      };
    }
  }
}

// lib/lexers/lexRange.js
function lexRange(str, pos, options) {
  return options.r1c1 ? lexRangeR1C1(str, pos, options) : lexRangeA1(str, pos, options);
}

// lib/parseSRange.js
var AT = 64;
var BR_CLOSE3 = 93;
var BR_OPEN3 = 91;
var COLON3 = 58;
var COMMA = 44;
var HASH2 = 35;
var QUOT_SINGLE2 = 39;
var keyTerms = {
  "headers": 1,
  "data": 2,
  "totals": 4,
  "all": 8,
  "this row": 16,
  "@": 16
};
var fz = (...a) => Object.freeze(a);
var sectionMap = {
  // no terms
  0: fz(),
  // single term
  1: fz("headers"),
  2: fz("data"),
  4: fz("totals"),
  8: fz("all"),
  16: fz("this row"),
  // headers+data
  3: fz("headers", "data"),
  // totals+data
  6: fz("data", "totals")
};
function matchKeyword(str, pos) {
  let p = pos;
  if (str.charCodeAt(p++) !== BR_OPEN3) {
    return;
  }
  if (str.charCodeAt(p++) !== HASH2) {
    return;
  }
  do {
    const c = str.charCodeAt(p);
    if (c >= 65 && c <= 90 || // A-Z
    c >= 97 && c <= 122 || // a-z
    c === 32) {
      p++;
    } else {
      break;
    }
  } while (p < pos + 11);
  if (str.charCodeAt(p++) !== BR_CLOSE3) {
    return;
  }
  return p - pos;
}
function skipWhitespace(str, pos) {
  let p = pos;
  while (isWS(str.charCodeAt(p))) {
    p++;
  }
  return p - pos;
}
function matchColumn(str, pos, allowUnbraced = true) {
  let p = pos;
  let column = "";
  if (str.charCodeAt(p) === BR_OPEN3) {
    p++;
    let c;
    do {
      c = str.charCodeAt(p);
      if (c === QUOT_SINGLE2) {
        p++;
        c = str.charCodeAt(p);
        if (c === QUOT_SINGLE2 || c === HASH2 || c === AT || c === BR_OPEN3 || c === BR_CLOSE3) {
          column += String.fromCharCode(c);
          p++;
        } else {
          return;
        }
      } else if (c === QUOT_SINGLE2 || c === HASH2 || c === AT || c === BR_OPEN3) {
        return;
      } else if (c === BR_CLOSE3) {
        p++;
        return [str.slice(pos, p), column];
      } else {
        column += String.fromCharCode(c);
        p++;
      }
    } while (p < str.length);
  } else if (allowUnbraced) {
    let c;
    do {
      c = str.charCodeAt(p);
      if (c === QUOT_SINGLE2 || c === HASH2 || c === AT || c === BR_OPEN3 || c === BR_CLOSE3 || c === COLON3) {
        break;
      } else {
        column += String.fromCharCode(c);
        p++;
      }
    } while (p < str.length);
    if (p !== pos) {
      return [column, column];
    }
  }
}
function parseSRange(str, pos = 0) {
  const columns = [];
  const start = pos;
  let m;
  let terms = 0;
  if (str.charCodeAt(pos) !== BR_OPEN3) {
    return;
  }
  if (m = matchKeyword(str, pos)) {
    const k = str.slice(pos + 2, pos + m - 1);
    pos += m;
    const term = keyTerms[k.toLowerCase()];
    if (!term) {
      return;
    }
    terms |= term;
  } else if (m = matchColumn(str, pos, false)) {
    pos += m[0].length;
    if (m[1]) {
      columns.push(m[1]);
    }
  } else {
    let expect_more = true;
    pos++;
    pos += skipWhitespace(str, pos);
    while (expect_more && (m = matchKeyword(str, pos))) {
      const k = str.slice(pos + 2, pos + m - 1);
      const term = keyTerms[k.toLowerCase()];
      if (!term) {
        return;
      }
      terms |= term;
      pos += m;
      pos += skipWhitespace(str, pos);
      expect_more = str.charCodeAt(pos) === COMMA;
      if (expect_more) {
        pos++;
        pos += skipWhitespace(str, pos);
      }
    }
    if (expect_more && str.charCodeAt(pos) === AT) {
      terms |= keyTerms["@"];
      pos += 1;
      expect_more = str.charCodeAt(pos) !== BR_CLOSE3;
    }
    if (!sectionMap[terms]) {
      return;
    }
    const leftCol = expect_more && matchColumn(str, pos, true);
    if (leftCol) {
      pos += leftCol[0].length;
      columns.push(leftCol[1]);
      if (str.charCodeAt(pos) === COLON3) {
        pos++;
        const rightCol = matchColumn(str, pos, true);
        if (rightCol) {
          pos += rightCol[0].length;
          columns.push(rightCol[1]);
        } else {
          return;
        }
      }
      expect_more = false;
    }
    pos += skipWhitespace(str, pos);
    if (expect_more || str.charCodeAt(pos) !== BR_CLOSE3) {
      return;
    }
    pos++;
  }
  const sections = sectionMap[terms];
  return {
    columns,
    sections: sections ? sections.concat() : sections,
    length: pos - start,
    token: str.slice(start, pos)
  };
}

// lib/lexers/lexStructured.js
var EXCL2 = 33;
function lexStructured(str, pos) {
  const structData = parseSRange(str, pos);
  if (structData && structData.length) {
    let i = structData.length;
    while (isWS(str.charCodeAt(pos + i))) {
      i++;
    }
    if (str.charCodeAt(pos + i) !== EXCL2) {
      return {
        type: REF_STRUCT,
        value: structData.token
      };
    }
  }
}

// lib/lexers/lexNumber.js
function advDigits(str, pos) {
  const start = pos;
  do {
    const c = str.charCodeAt(pos);
    if (c < 48 || c > 57) {
      break;
    }
    pos++;
  } while (pos < str.length);
  return pos - start;
}
function lexNumber(str, pos) {
  const start = pos;
  const lead = advDigits(str, pos);
  if (!lead) {
    return;
  }
  pos += lead;
  const c0 = str.charCodeAt(pos);
  if (c0 === 46) {
    pos++;
    const frac = advDigits(str, pos);
    if (!frac) {
      return;
    }
    pos += frac;
  }
  const c1 = str.charCodeAt(pos);
  if (c1 === 69 || c1 === 101) {
    pos++;
    const sign = str.charCodeAt(pos);
    if (sign === 43 || sign === 45) {
      pos++;
    }
    const exp = advDigits(str, pos);
    if (!exp) {
      return;
    }
    pos += exp;
  }
  return { type: NUMBER, value: str.slice(start, pos) };
}

// lib/lexers/lexNamed.js
function lexNamed(str, pos) {
  const start = pos;
  const s = str.charCodeAt(pos);
  if (s >= 65 && s <= 90 || // A-Z
  s >= 97 && s <= 122 || // a-z
  s === 95 || // _
  s === 92 || // \
  s > 160) {
    pos++;
  } else {
    return;
  }
  let c;
  do {
    c = str.charCodeAt(pos);
    if (c >= 65 && c <= 90 || // A-Z
    c >= 97 && c <= 122 || // a-z
    c >= 48 && c <= 57 || // 0-9
    c === 95 || // _
    c === 92 || // \
    c === 46 || // .
    c === 63 || // ?
    c > 160) {
      pos++;
    } else {
      break;
    }
  } while (isFinite(c));
  const len = pos - start;
  if (len && len < 255) {
    if (s === 92 && len < 3) {
      return;
    }
    if (len === 1 && (s === 114 || s === 82 || s === 99 || s === 67)) {
      return;
    }
    return { type: REF_NAMED, value: str.slice(start, pos) };
  }
}

// lib/lexers/lexRefOp.js
var EXCL3 = 33;
function lexRefOp(str, pos, opts) {
  if (str.charCodeAt(pos) === EXCL3) {
    return { type: OPERATOR, value: str[pos] };
  }
  if (!opts.r1c1) {
    const opLen = advRangeOp(str, pos);
    if (opLen) {
      return { type: OPERATOR, value: str.slice(pos, pos + opLen) };
    }
  }
}

// lib/lexers/sets.js
var lexers = [
  lexError,
  lexRangeTrim,
  lexOperator,
  lexFunction,
  lexBoolean,
  lexNewLine,
  lexWhitespace,
  lexString,
  lexContext,
  lexRange,
  lexStructured,
  lexNumber,
  lexNamed
];
var lexersRefs = [
  lexRefOp,
  lexContext,
  lexRange,
  lexStructured,
  lexNamed
];

// lib/lexer.js
var reLetLambda = /^l(?:ambda|et)$/i;
var isType = (t, type) => t && t.type === type;
var isTextTokenType = (tokenType) => tokenType === REF_NAMED || tokenType === FUNCTION;
var causesBinaryMinus = (token) => {
  return !isType(token, OPERATOR) || (token.value === "%" || token.value === "}" || token.value === ")" || token.value === "#");
};
function fixRCNames(tokens2) {
  let withinCall = 0;
  let parenDepth = 0;
  let lastToken;
  for (const token of tokens2) {
    if (token.type === OPERATOR) {
      if (token.value === "(") {
        parenDepth++;
        if (lastToken.type === FUNCTION) {
          if (reLetLambda.test(lastToken.value)) {
            withinCall = parenDepth;
          }
        }
      } else if (token.value === ")") {
        parenDepth--;
        if (parenDepth < withinCall) {
          withinCall = 0;
        }
      }
    } else if (withinCall && token.type === UNKNOWN && /^[rc]$/.test(token.value)) {
      token.type = REF_NAMED;
    }
    lastToken = token;
  }
  return tokens2;
}
function getTokens(fx, tokenHandlers, options = {}) {
  const {
    withLocation = false,
    mergeRefs = true,
    negativeNumbers = true
  } = options;
  const opts = {
    withLocation,
    mergeRefs,
    allowTernary: options.allowTernary ?? false,
    negativeNumbers,
    r1c1: options.r1c1 ?? false,
    xlsx: options.xlsx ?? false
  };
  const tokens2 = [];
  let pos = 0;
  let letOrLambda = 0;
  let unknownRC = 0;
  const trimOps = [];
  let tail0;
  let tail1;
  let lastToken;
  const pushToken = (token) => {
    let tokenType = token.type;
    const isCurrUnknown = tokenType === UNKNOWN;
    const isLastUnknown = lastToken && lastToken.type === UNKNOWN;
    if (lastToken && (isCurrUnknown && isLastUnknown || isCurrUnknown && isTextTokenType(lastToken.type) || isLastUnknown && isTextTokenType(tokenType))) {
      lastToken.value += token.value;
      lastToken.type = UNKNOWN;
      if (withLocation) {
        lastToken.loc[1] = token.loc[1];
      }
    } else {
      if (tokenType === OPERATOR_TRIM) {
        trimOps.push(tokens2.length);
        tokenType = UNKNOWN;
        token.type = UNKNOWN;
      }
      tokens2[tokens2.length] = token;
      lastToken = token;
      if (tokenType !== WHITESPACE && tokenType !== NEWLINE) {
        tail1 = tail0;
        tail0 = token;
      }
    }
  };
  if (fx.startsWith("=")) {
    const token = { type: FX_PREFIX, value: "=" };
    if (withLocation) {
      token.loc = [0, 1];
    }
    pos++;
    pushToken(token);
  }
  const numHandlers = tokenHandlers.length;
  while (pos < fx.length) {
    const startPos = pos;
    let token;
    for (let i = 0; i < numHandlers; i++) {
      token = tokenHandlers[i](fx, pos, opts);
      if (token) {
        pos += token.value.length;
        break;
      }
    }
    if (!token) {
      token = {
        type: UNKNOWN,
        value: fx[pos]
      };
      pos++;
    }
    if (withLocation) {
      token.loc = [startPos, pos];
    }
    if (lastToken && token.value === "(" && lastToken.type === FUNCTION) {
      if (reLetLambda.test(lastToken.value)) {
        letOrLambda++;
      }
    }
    if (token.type === UNKNOWN && token.value.length === 1) {
      const valLC = token.value.toLowerCase();
      unknownRC += valLC === "r" || valLC === "c" ? 1 : 0;
    }
    if (negativeNumbers && token.type === NUMBER) {
      const last1 = lastToken;
      if (last1?.type === OPERATOR && last1.value === "-") {
        if (!tail1 || tail1.type === FX_PREFIX || !causesBinaryMinus(tail1)) {
          const minus = tokens2.pop();
          token.value = "-" + token.value;
          if (token.loc) {
            token.loc[0] = minus.loc[0];
          }
          tail0 = tail1;
          lastToken = tokens2[tokens2.length - 1];
        }
      }
    }
    pushToken(token);
  }
  if (unknownRC && letOrLambda) {
    fixRCNames(tokens2);
  }
  for (const index of trimOps) {
    const before = tokens2[index - 1];
    const after = tokens2[index + 1];
    tokens2[index].type = before?.type === REF_RANGE && after?.type === REF_RANGE ? OPERATOR : UNKNOWN;
  }
  if (mergeRefs) {
    return mergeRefTokens(tokens2);
  }
  return tokens2;
}
function tokenize(formula, options = {}) {
  return getTokens(formula, lexers, options);
}

// lib/isType.js
function isRange(token) {
  return !!token && (token.type === REF_RANGE || token.type === REF_BEAM || token.type === REF_TERNARY);
}
function isReference(token) {
  return !!token && (token.type === REF_RANGE || token.type === REF_BEAM || token.type === REF_TERNARY || token.type === REF_STRUCT || token.type === REF_NAMED);
}
function isLiteral(token) {
  return !!token && (token.type === BOOLEAN || token.type === ERROR || token.type === NUMBER || token.type === STRING);
}
function isError(token) {
  return !!token && token.type === ERROR;
}
function isWhitespace(token) {
  return !!token && (token.type === WHITESPACE || token.type === NEWLINE);
}
function isFunction(token) {
  return !!token && token.type === FUNCTION;
}
function isFxPrefix(token) {
  return !!token && token.type === FX_PREFIX;
}
function isOperator(token) {
  return !!token && token.type === OPERATOR;
}

// lib/parser.js
var END2 = "(END)";
var FUNCTION2 = "(FUNCTION)";
var WHITESPACE2 = "(WHITESPACE)";
var refFunctions = [
  "ANCHORARRAY",
  "CHOOSE",
  "DROP",
  "IF",
  "IFS",
  "INDEX",
  "INDIRECT",
  "LAMBDA",
  "LET",
  "OFFSET",
  "REDUCE",
  "SINGLE",
  "SWITCH",
  "TAKE",
  "TRIMRANGE",
  "XLOOKUP"
];
var symbolTable = {};
var currentNode;
var tokens;
var tokenIndex;
var permitArrayRanges = false;
var permitArrayCalls = false;
var looseRefCalls = false;
var isReferenceFunctionName = (fnName) => {
  return looseRefCalls || refFunctions.includes(fnName.toUpperCase());
};
var isReferenceToken = (token, allowOperators = false) => {
  const value = (token && token.value) + "";
  if (isReference(token)) {
    return true;
  }
  if (allowOperators && isOperator(token) && (value === ":" || value === "," || !value.trim())) {
    return true;
  }
  if (isFunction(token) && isReferenceFunctionName(value)) {
    return true;
  }
  if (isError(token) && value === "#REF!") {
    return true;
  }
  return false;
};
var isReferenceNode = (node) => {
  return !!node && (node.type === REFERENCE || (node.type === ERROR_LITERAL || node.type === ERROR) && node.value === "#REF!" || node.type === BINARY && (node.operator === ":" || node.operator === " " || node.operator === ",") || isReference(node) || node.type === CALL && isReferenceFunctionName(node.callee.name));
};
function halt(message, atIndex = null) {
  const err = new Error(message);
  err.source = tokens.map((d) => d.value).join("");
  err.sourceOffset = tokens.slice(0, atIndex ?? tokenIndex).reduce((a, d) => a + d.value.length, 0);
  throw err;
}
function refIsUpcoming(allowOperators = false) {
  let i = tokenIndex;
  let next;
  do {
    next = tokens[++i];
  } while (next && (isWhitespace(next) || isOperator(next) && next.value === "("));
  return isReferenceToken(next, allowOperators);
}
function advance(expectNext = null, leftNode = null) {
  if (expectNext && expectNext !== currentNode.id) {
    halt(`Expected ${expectNext} but got ${currentNode.id}`);
  }
  if (isWhitespace(tokens[tokenIndex])) {
    const haveRef = isReferenceNode(leftNode);
    const possibleWSOp = haveRef && refIsUpcoming(false);
    const nextIsCall = haveRef && tokens[tokenIndex + 1] && tokens[tokenIndex + 1].value === "(";
    if (!possibleWSOp && !nextIsCall) {
      while (isWhitespace(tokens[tokenIndex])) {
        tokenIndex++;
      }
    }
  }
  if (tokenIndex >= tokens.length) {
    currentNode = symbolTable[END2];
    return;
  }
  const token = tokens[tokenIndex];
  tokenIndex += 1;
  if (token.unterminated) {
    halt("Encountered an unterminated token");
  }
  let node;
  if (isOperator(token)) {
    node = symbolTable[token.value];
    if (!node) {
      halt(`Unknown operator ${token.value}`);
    }
  } else if (isWhitespace(token)) {
    node = symbolTable[WHITESPACE2];
  } else if (isLiteral(token)) {
    node = symbolTable[LITERAL];
  } else if (isReference(token)) {
    node = symbolTable[REFERENCE];
  } else if (isFunction(token)) {
    node = symbolTable[FUNCTION2];
  } else {
    halt(`Unexpected ${token.type} token: ${token.value}`);
  }
  currentNode = Object.create(node);
  currentNode.type = token.type;
  currentNode.value = token.value;
  if (token.loc) {
    currentNode.loc = [...token.loc];
  }
  return currentNode;
}
function expression(rbp) {
  let t = currentNode;
  advance(null, t);
  let left = t.nud();
  while (rbp < currentNode.lbp) {
    t = currentNode;
    advance(null, t);
    left = t.led(left);
  }
  return left;
}
var original_symbol = {
  // null denotation
  nud: () => halt("Invalid syntax"),
  // Undefined
  // left denotation
  led: () => halt("Missing operator")
};
function symbol(id, bp = 0) {
  let s = symbolTable[id];
  if (s) {
    if (bp >= s.lbp) {
      s.lbp = bp;
    }
  } else {
    s = { ...original_symbol };
    s.id = id;
    s.value = id;
    s.lbp = bp;
    symbolTable[id] = s;
  }
  return s;
}
function infix(id, bp, led) {
  const s = symbol(id, bp);
  s.led = led || function(left) {
    this.type = BINARY;
    this.operator = this.value;
    delete this.value;
    const right = expression(bp);
    this.arguments = [left, right];
    if (this.loc) {
      this.loc = [left.loc[0], right.loc[1]];
    }
    return this;
  };
  return s;
}
function postfix(id, led) {
  const s = symbol(id, 0);
  s.lbp = 70;
  s.led = led || function(left) {
    this.type = UNARY;
    this.operator = this.value;
    delete this.value;
    this.arguments = [left];
    if (this.loc) {
      this.loc[0] = left.loc[0];
    }
    return this;
  };
  return s;
}
function prefix(id, nud) {
  const s = symbol(id);
  s.nud = nud || function() {
    this.type = UNARY;
    this.operator = this.value;
    delete this.value;
    const subexpr = expression(70);
    this.arguments = [subexpr];
    if (this.loc) {
      this.loc[1] = subexpr.loc[1];
    }
    return this;
  };
  return s;
}
function rangeInfix(id, bp) {
  return infix(id, bp, function(left) {
    if (!isReferenceNode(left)) {
      halt(`Unexpected ${id} operator`);
    }
    const right = expression(bp);
    if (!isReferenceNode(right, true)) {
      halt(`Unexpected ${currentNode.type} following ${this.id}`);
    }
    this.type = BINARY;
    this.operator = this.value.trim() ? this.value : " ";
    delete this.value;
    this.arguments = [left, right];
    if (this.loc) {
      this.loc = [left.loc[0], right.loc[1]];
    }
    return this;
  });
}
symbol(END2);
rangeInfix(":", 80);
var comma = rangeInfix(",", 80);
rangeInfix(WHITESPACE2, 80);
var unionRefs = (enable) => {
  const currState = comma.lbp > 0;
  if (enable != null) {
    comma.lbp = enable ? 80 : 0;
  }
  return currState;
};
postfix("%");
postfix("#", function(left) {
  if (!isReferenceNode(left)) {
    halt("# expects a reference");
  }
  this.type = UNARY;
  this.operator = this.value;
  delete this.value;
  this.arguments = [left];
  return this;
});
prefix("+");
prefix("-");
prefix("@");
infix("^", 50);
infix("*", 40);
infix("/", 40);
infix("+", 30);
infix("-", 30);
infix("&", 20);
infix("=", 10);
infix("<", 10);
infix(">", 10);
infix("<=", 10);
infix(">=", 10);
infix("<>", 10);
symbol(LITERAL).nud = function() {
  const { type, value } = this;
  this.type = LITERAL;
  this.raw = value;
  if (type === NUMBER) {
    this.value = +value;
  } else if (type === BOOLEAN) {
    this.value = value.toUpperCase() === "TRUE";
  } else if (type === ERROR) {
    this.type = ERROR_LITERAL;
    this.value = value.toUpperCase();
  } else if (type === STRING) {
    this.value = value.slice(1, -1).replace(/""/g, '"');
  } else {
    throw new Error("Unsupported literal type: " + type);
  }
  return this;
};
symbol(REFERENCE).nud = function() {
  if (this.type === REF_NAMED) {
    this.kind = "name";
  } else if (this.type === REF_STRUCT) {
    this.kind = "table";
  } else if (this.type === REF_BEAM) {
    this.kind = "beam";
  } else {
    this.kind = "range";
  }
  this.type = REFERENCE;
  return this;
};
symbol(")");
prefix("(", function() {
  const prevState = unionRefs(true);
  const e = expression(0);
  advance(")", e);
  unionRefs(prevState);
  return e;
});
symbol(FUNCTION2).nud = function() {
  return this;
};
infix("(", 90, function(left) {
  let callee = {
    type: IDENTIFIER,
    name: left.value
  };
  if (left.id !== FUNCTION2) {
    if (left.type === LAMBDA || // Excel only allows calls to "names" and ref functions. Since we don't
    // differentiate between the two (this requires a table of function names)
    // we're overly permissive here:
    left.type === CALL || left.type === LET || left.type === REFERENCE || left.type === UNARY && left.value === "#" || // Because it's really SINGLE(...)()
    left.type === ERROR_LITERAL && left.value === "#REF!") {
      callee = left;
    } else {
      halt("Unexpected call", tokenIndex - 1);
    }
  }
  const lcFn = left.value.toLowerCase();
  if (lcFn === "lambda") {
    return parseLambda.call(this, left);
  }
  if (lcFn === "let") {
    return parseLet.call(this, left);
  }
  const args = [];
  let lastWasComma = false;
  if (currentNode.id !== ")") {
    const prevState = unionRefs(false);
    while (currentNode.id !== ")") {
      if (isWhitespace(currentNode)) {
        advance();
      }
      if (currentNode.id === ",") {
        args.push(null);
        lastWasComma = true;
        advance();
      } else {
        const arg = expression(0);
        args.push(arg);
        lastWasComma = false;
        if (currentNode.id === ",") {
          advance(",");
          lastWasComma = true;
        }
      }
    }
    unionRefs(prevState);
  }
  if (lastWasComma) {
    args.push(null);
  }
  const closeParen = currentNode;
  delete this.value;
  this.type = CALL;
  this.callee = callee;
  if (left.loc) {
    this.callee.loc = [...left.loc];
  }
  this.arguments = args;
  if (left.loc) {
    this.loc = [left.loc[0], closeParen.loc[1]];
  }
  advance(")", this);
  return this;
});
function parseLambda(left) {
  const args = [];
  const argNames = {};
  let body;
  let done = false;
  const prevState = unionRefs(false);
  if (currentNode.id !== ")") {
    while (!done) {
      if (isWhitespace(currentNode)) {
        advance();
      }
      const argTokenIndex = tokenIndex;
      const arg = expression(0);
      if (currentNode.id === ",") {
        if (arg.type === REFERENCE && arg.kind === "name") {
          const currName = arg.value.toLowerCase();
          if (currName in argNames) {
            halt("Duplicate name: " + arg.value);
          }
          argNames[currName] = 1;
          const a = { type: IDENTIFIER, name: arg.value };
          if (arg.loc) {
            a.loc = arg.loc;
          }
          args.push(a);
        } else {
          tokenIndex = argTokenIndex;
          halt("LAMBDA argument is not a name");
        }
        advance(",");
      } else {
        body = arg;
        done = true;
      }
    }
  }
  unionRefs(prevState);
  delete this.value;
  this.type = LAMBDA;
  this.params = args;
  this.body = body || null;
  if (left.loc) {
    this.loc = [left.loc[0], currentNode.loc[1]];
  }
  advance(")", this);
  return this;
}
function parseLet(left) {
  const args = [];
  const vals = [];
  const argNames = {};
  let body;
  let argCounter = 0;
  const addArgument = (arg, lastArg) => {
    if (body) {
      halt("Unexpected argument following calculation");
    }
    if (lastArg && argCounter >= 2) {
      body = arg;
    } else {
      const wantName = !(argCounter % 2);
      if (wantName) {
        if (arg && (arg.type === REFERENCE && arg.kind === "name")) {
          const currName = arg.value.toLowerCase();
          if (currName in argNames) {
            halt("Duplicate name: " + arg.value);
          }
          argNames[currName] = 1;
          args.push({ type: IDENTIFIER, name: arg.value, loc: arg.loc });
        } else if (argCounter >= 2) {
          body = arg;
        } else {
          halt("Argument is not a name");
        }
      } else {
        vals.push(arg);
      }
    }
    argCounter++;
  };
  const prevState = unionRefs(false);
  let lastWasComma = false;
  if (currentNode.id !== ")") {
    while (currentNode.id !== ")") {
      if (isWhitespace(currentNode)) {
        advance();
      }
      if (currentNode.id === ",") {
        addArgument(null);
        lastWasComma = true;
        advance();
      } else {
        const arg = expression(0);
        addArgument(arg, currentNode.id !== ",");
        lastWasComma = false;
        if (currentNode.id === ",") {
          advance(",");
          lastWasComma = true;
        }
      }
    }
    unionRefs(prevState);
  }
  if (lastWasComma) {
    addArgument(null, true);
  }
  if (body === void 0) {
    halt("Unexpected end of arguments");
  }
  unionRefs(prevState);
  delete this.value;
  this.type = LET;
  this.declarations = [];
  if (!args.length) {
    halt("Unexpected end of arguments");
  }
  for (let i = 0; i < args.length; i++) {
    const s = {
      type: LET_DECL,
      id: args[i],
      init: vals[i],
      loc: args[i].loc && [args[i].loc[0], vals[i].loc[1]]
    };
    this.declarations.push(s);
  }
  this.body = body;
  if (left.loc) {
    this.loc = [left.loc[0], currentNode.loc[1]];
  }
  advance(")", this);
  return this;
}
symbol("}");
symbol(";");
prefix("{", function() {
  if (currentNode.id === "}") {
    halt("Unexpected empty array");
  }
  let row = [];
  let done = false;
  const rows = [row];
  const prevState = unionRefs(false);
  while (!done) {
    if (isWhitespace(currentNode)) {
      advance();
    }
    if (isLiteral(currentNode)) {
      row.push(symbolTable[LITERAL].nud.call(currentNode));
      advance();
    } else if (permitArrayRanges && isReferenceNode(currentNode)) {
      row.push(symbolTable[REFERENCE].nud.call(currentNode));
      advance();
    } else if (permitArrayCalls && isFunction(currentNode)) {
      const arg = expression(0);
      row.push(arg);
    } else {
      halt(`Unexpected ${currentNode.type} in array: ${currentNode.value}`);
    }
    if (currentNode.id === ",") {
      advance(",");
    } else if (currentNode.id === ";") {
      advance(";");
      row = [];
      rows.push(row);
    } else {
      done = true;
    }
  }
  const closingBrace = currentNode;
  advance("}");
  unionRefs(prevState);
  this.type = ARRAY;
  this.elements = rows;
  if (this.loc) {
    this.loc[1] = closingBrace.loc[1];
  }
  delete this.value;
  return this;
});
function parse(formula, options) {
  if (typeof formula === "string") {
    tokens = tokenize(formula, {
      withLocation: false,
      ...options,
      mergeRefs: true
    });
  } else if (Array.isArray(formula)) {
    tokens = formula;
  } else {
    throw new Error("Parse requires a string or array of tokens.");
  }
  permitArrayRanges = options?.permitArrayRanges;
  permitArrayCalls = options?.permitArrayCalls;
  looseRefCalls = options?.looseRefCalls;
  tokenIndex = 0;
  while (isWhitespace(tokens[tokenIndex]) || isFxPrefix(tokens[tokenIndex])) {
    tokenIndex++;
  }
  advance();
  unionRefs(true);
  const root = expression(0);
  advance(END2);
  return root;
}

// lib/parseRef.js
function splitPrefix(str, stringsOnly = false) {
  let inBrace = false;
  let currStr = "";
  const parts = [];
  const flush = () => {
    if (currStr) {
      parts.push(
        stringsOnly ? currStr : { value: currStr, braced: inBrace }
      );
    }
    currStr = "";
  };
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "[") {
      flush();
      inBrace = true;
    } else if (char === "]") {
      flush();
      inBrace = false;
    } else {
      currStr += char;
    }
  }
  flush();
  return parts;
}
function splitContext(contextString, data, xlsx) {
  const ctx = splitPrefix(contextString, !xlsx);
  if (xlsx) {
    if (ctx.length > 1) {
      data.workbookName = ctx[ctx.length - 2].value;
      data.sheetName = ctx[ctx.length - 1].value;
    } else if (ctx.length === 1) {
      const item = ctx[0];
      if (item.braced) {
        data.workbookName = item.value;
      } else {
        data.sheetName = item.value;
      }
    }
  } else {
    data.context = ctx;
  }
}
var unquote = (d) => d.slice(1, -1).replace(/''/g, "'");
var pRangeOp = (t, data) => {
  const value = t?.value;
  if (value === ":" || value === ".:" || value === ":." || value === ".:.") {
    data.operator = value;
    return 1;
  }
};
var pRange = (t, data) => {
  if (t?.type === REF_RANGE) {
    data.r0 = t.value;
    return 1;
  }
};
var pPartial = (t, data) => {
  if (t?.type === REF_TERNARY) {
    data.r0 = t.value;
    return 1;
  }
};
var pRange2 = (t, data) => {
  if (t?.type === REF_RANGE) {
    data.r1 = t.value;
    return 1;
  }
};
var pBang = (t) => {
  if (t?.type === OPERATOR && t.value === "!") {
    return 1;
  }
};
var pBeam = (t, data) => {
  if (t?.type === REF_BEAM) {
    data.r0 = t.value;
    return 1;
  }
};
var pStrucured = (t, data) => {
  if (t.type === REF_STRUCT) {
    data.struct = t.value;
    return 1;
  }
};
var pContext = (t, data, xlsx) => {
  const type = t?.type;
  if (type === CONTEXT) {
    splitContext(t.value, data, xlsx);
    return 1;
  }
  if (type === CONTEXT_QUOTE) {
    splitContext(unquote(t.value), data, xlsx);
    return 1;
  }
};
var pNamed = (t, data) => {
  if (t?.type === REF_NAMED) {
    data.name = t.value;
    return 1;
  }
};
var validRuns = [
  [pPartial],
  [pRange, pRangeOp, pRange2],
  [pRange],
  [pBeam],
  [pContext, pBang, pPartial],
  [pContext, pBang, pRange, pRangeOp, pRange2],
  [pContext, pBang, pRange],
  [pContext, pBang, pBeam]
];
var validRunsNamed = validRuns.concat([
  [pNamed],
  [pContext, pBang, pNamed],
  [pStrucured],
  [pNamed, pStrucured],
  [pContext, pBang, pNamed, pStrucured]
]);
function parseRef(ref, opts) {
  const options = {
    withLocation: opts.withLocation ?? false,
    mergeRefs: opts.mergeRefs ?? false,
    allowTernary: opts.allowTernary ?? false,
    allowNamed: opts.allowNamed ?? true,
    r1c1: opts.r1c1 ?? false,
    xlsx: opts.xlsx ?? false
  };
  const tokens2 = getTokens(ref, lexersRefs, options);
  const xlsx = options.xlsx;
  if (tokens2.length && tokens2[0].type === FX_PREFIX) {
    tokens2.shift();
  }
  const runs = options.allowNamed ? validRunsNamed : validRuns;
  for (const run of runs) {
    if (run.length === tokens2.length) {
      const data = xlsx ? {
        workbookName: "",
        sheetName: "",
        r0: "",
        r1: "",
        name: "",
        operator: ""
      } : {
        context: [],
        r0: "",
        r1: "",
        name: "",
        operator: ""
      };
      const valid = run.every((parse2, i) => parse2(tokens2[i], data, xlsx));
      if (valid) {
        return data;
      }
    }
  }
  return null;
}

// lib/toCol.js
var charFrom = String.fromCharCode;
function toCol(columnIndex) {
  return (columnIndex >= 702 ? charFrom(((columnIndex - 702) / 676 - 0) % 26 + 65) : "") + (columnIndex >= 26 ? charFrom((columnIndex / 26 - 1) % 26 + 65) : "") + charFrom(columnIndex % 26 + 65);
}

// lib/stringifyPrefix.js
var reBannedChars = /[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;
function stringifyPrefix(ref) {
  let pre = "";
  let quote = 0;
  let nth = 0;
  const context = ref.context || [];
  for (let i = context.length; i > -1; i--) {
    const scope = context[i];
    if (scope) {
      const part = nth % 2 ? "[" + scope + "]" : scope;
      pre = part + pre;
      quote += +reBannedChars.test(scope);
      nth++;
    }
  }
  if (quote) {
    pre = "'" + pre.replace(/'/g, "''") + "'";
  }
  return pre ? pre + "!" : pre;
}
function stringifyPrefixAlt(ref) {
  let pre = "";
  let quote = 0;
  const { workbookName, sheetName } = ref;
  if (workbookName) {
    pre += "[" + workbookName + "]";
    quote += +reBannedChars.test(workbookName);
  }
  if (sheetName) {
    pre += sheetName;
    quote += +reBannedChars.test(sheetName);
  }
  if (quote) {
    pre = "'" + pre.replace(/'/g, "''") + "'";
  }
  return pre ? pre + "!" : pre;
}

// lib/fromA1.js
var CHAR_DOLLAR = 36;
var CHAR_PERIOD = 46;
var CHAR_COLON = 58;
var CHAR_A_LC = 97;
var CHAR_A_UC = 65;
var CHAR_Z_LC = 122;
var CHAR_Z_UC = 90;
var CHAR_0 = 48;
var CHAR_1 = 49;
var CHAR_9 = 57;
function advRangeOp2(str, pos) {
  const c0 = str.charCodeAt(pos);
  if (c0 === CHAR_PERIOD) {
    const c1 = str.charCodeAt(pos + 1);
    if (c1 === CHAR_COLON) {
      return str.charCodeAt(pos + 2) === CHAR_PERIOD ? [3, "both"] : [2, "head"];
    }
  } else if (c0 === CHAR_COLON) {
    const c1 = str.charCodeAt(pos + 1);
    return c1 === CHAR_PERIOD ? [2, "tail"] : [1, ""];
  }
  return [0, ""];
}
function advA1Col2(str, pos) {
  const start = pos;
  const lock = str.charCodeAt(pos) === CHAR_DOLLAR;
  if (lock) {
    pos++;
  }
  const stop = pos + 3;
  let col = 0;
  do {
    const c = str.charCodeAt(pos);
    if (c >= CHAR_A_UC && c <= CHAR_Z_UC) {
      col = 26 * col + c - (CHAR_A_UC - 1);
      pos++;
    } else if (c >= CHAR_A_LC && c <= CHAR_Z_LC) {
      col = 26 * col + c - (CHAR_A_LC - 1);
      pos++;
    } else {
      break;
    }
  } while (pos < stop && pos < str.length);
  return col && col <= MAX_COLS + 1 ? [pos - start, col - 1, lock] : [0, 0, false];
}
function advA1Row2(str, pos) {
  const start = pos;
  const lock = str.charCodeAt(pos) === CHAR_DOLLAR;
  if (lock) {
    pos++;
  }
  const stop = pos + 7;
  let row = 0;
  let c = str.charCodeAt(pos);
  if (c >= CHAR_1 && c <= CHAR_9) {
    row = row * 10 + c - CHAR_0;
    pos++;
    do {
      c = str.charCodeAt(pos);
      if (c >= CHAR_0 && c <= CHAR_9) {
        row = row * 10 + c - CHAR_0;
        pos++;
      } else {
        break;
      }
    } while (pos < stop && pos < str.length);
  }
  return row && row <= MAX_ROWS + 1 ? [pos - start, row - 1, lock] : [0, 0, false];
}
function makeRange(top, $top, left, $left, bottom, $bottom, right, $right, trim) {
  if (right != null && (left == null || left != null && right < left)) {
    [left, right, $left, $right] = [right, left, $right, $left];
  }
  if (bottom != null && (top == null || top != null && bottom < top)) {
    [top, bottom, $top, $bottom] = [bottom, top, $bottom, $top];
  }
  const range = { top, left, bottom, right, $top, $left, $bottom, $right };
  if (trim) {
    range.trim = trim;
  }
  return range;
}
function fromA1(str, allowTernary = true) {
  let p = 0;
  const [leftChars, left, $left] = advA1Col2(str, p);
  let right = 0;
  let $right = false;
  let bottom = 0;
  let $bottom = false;
  let rightChars;
  let bottomChars;
  if (leftChars) {
    p += leftChars;
    const [topChars, top, $top] = advA1Row2(str, p);
    p += topChars;
    const [op, trim] = advRangeOp2(str, p);
    if (op) {
      p += op;
      [rightChars, right, $right] = advA1Col2(str, p);
      p += rightChars;
      [bottomChars, bottom, $bottom] = advA1Row2(str, p);
      p += bottomChars;
      if (topChars && bottomChars && rightChars) {
        if (p === str.length) {
          return makeRange(top, $top, left, $left, bottom, $bottom, right, $right, trim);
        }
      } else if (!topChars && !bottomChars) {
        if (p === str.length) {
          return makeRange(null, false, left, $left, null, false, right, $right, trim);
        }
      } else if (allowTernary && (bottomChars || rightChars) && p === str.length) {
        if (!topChars) {
          return makeRange(null, false, left, $left, bottom, $bottom, right, $right, trim);
        } else if (!bottomChars) {
          return makeRange(top, $top, left, $left, null, false, right, $right, trim);
        } else {
          return makeRange(top, $top, left, $left, bottom, $bottom, null, false, trim);
        }
      }
    }
    if (topChars && p === str.length) {
      return makeRange(top, $top, left, $left, top, $top, left, $left, trim);
    }
  } else {
    const [topChars, top, $top] = advA1Row2(str, p);
    if (topChars) {
      p += topChars;
      const [op, trim] = advRangeOp2(str, p);
      if (op) {
        p += op;
        [rightChars, right, $right] = advA1Col2(str, p);
        p += rightChars;
        [bottomChars, bottom, $bottom] = advA1Row2(str, p);
        p += bottomChars;
        if (rightChars && bottomChars && allowTernary) {
          if (p === str.length) {
            return makeRange(top, $top, null, false, bottom, $bottom, right, $right, trim);
          }
        } else if (!rightChars && bottomChars) {
          if (p === str.length) {
            return makeRange(top, $top, null, false, bottom, $bottom, null, false, trim);
          }
        }
      }
    }
  }
  return null;
}

// lib/a1.js
var clamp = (min, val, max) => Math.min(Math.max(val, min), max);
var toColStr = (c, a) => (a ? "$" : "") + toCol(c);
var toRowStr = (r, a) => (a ? "$" : "") + toRow(r);
function toRow(top) {
  return String(top + 1);
}
function rangeOperator(trim) {
  if (trim === "both") {
    return ".:.";
  } else if (trim === "head") {
    return ".:";
  } else if (trim === "tail") {
    return ":.";
  }
  return ":";
}
function toA1(range) {
  let { top, left, bottom, right, trim } = range;
  const { $left, $right, $top, $bottom } = range;
  const noLeft = left == null;
  const noRight = right == null;
  const noTop = top == null;
  const noBottom = bottom == null;
  top = clamp(0, top | 0, MAX_ROWS);
  left = clamp(0, left | 0, MAX_COLS);
  if (!noLeft && !noTop && noRight && noBottom) {
    bottom = top;
    right = left;
  } else {
    bottom = clamp(0, bottom | 0, MAX_ROWS);
    right = clamp(0, right | 0, MAX_COLS);
  }
  const op = rangeOperator(trim);
  const allRows = top === 0 && bottom >= MAX_ROWS;
  const haveAbsCol = $left && !noLeft || $right && !noRight;
  if (allRows && !noLeft && !noRight && (!haveAbsCol || left === right) || noTop && noBottom) {
    return toColStr(left, $left) + op + toColStr(right, $right);
  }
  const allCols = left === 0 && right >= MAX_COLS;
  const haveAbsRow = $top && !noTop || $bottom && !noBottom;
  if (allCols && !noTop && !noBottom && (!haveAbsRow || top === bottom) || noLeft && noRight) {
    return toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  if (!noLeft && !noTop && !noRight && noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toColStr(right, $right);
  }
  if (!noLeft && noTop && !noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(bottom, $bottom) + op + toColStr(right, $right);
  }
  if (!noLeft && !noTop && noRight && !noBottom) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  if (noLeft && !noTop && !noRight && !noBottom) {
    return toColStr(right, $right) + toRowStr(top, $top) + op + toRowStr(bottom, $bottom);
  }
  if (right !== left || bottom !== top || $right !== $left || $bottom !== $top) {
    return toColStr(left, $left) + toRowStr(top, $top) + op + toColStr(right, $right) + toRowStr(bottom, $bottom);
  }
  return toColStr(left, $left) + toRowStr(top, $top);
}
function parseA1Ref(refString, { allowNamed = true, allowTernary = false, xlsx = false } = {}) {
  const d = parseRef(refString, { allowNamed, allowTernary, xlsx, r1c1: false });
  if (d && (d.r0 || d.name)) {
    let range = null;
    if (d.r0) {
      range = fromA1(d.r1 ? d.r0 + d.operator + d.r1 : d.r0);
    }
    if (range) {
      return xlsx ? { workbookName: d.workbookName, sheetName: d.sheetName, range } : { context: d.context, range };
    }
    if (d.name) {
      return xlsx ? { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name } : { context: d.context, name: d.name };
    }
    return null;
  }
  return null;
}
function stringifyA1Ref(refObject, { xlsx = false } = {}) {
  const prefix2 = xlsx ? stringifyPrefixAlt(refObject) : stringifyPrefix(refObject);
  return prefix2 + (refObject.name ? refObject.name : toA1(refObject.range));
}
function addA1RangeBounds(range) {
  if (range.top == null) {
    range.top = 0;
    range.$top = false;
  }
  if (range.bottom == null) {
    range.bottom = MAX_ROWS;
    range.$bottom = false;
  }
  if (range.left == null) {
    range.left = 0;
    range.$left = false;
  }
  if (range.right == null) {
    range.right = MAX_COLS;
    range.$right = false;
  }
  return range;
}

// lib/parseStructRef.js
function parseStructRef(ref, options = { xlsx: false }) {
  const r = parseRef(ref, options);
  if (r && r.struct) {
    const structData = parseSRange(r.struct);
    if (structData && structData.length === r.struct.length) {
      return options.xlsx ? {
        workbookName: r.workbookName,
        sheetName: r.sheetName,
        table: r.name,
        columns: structData.columns,
        sections: structData.sections
      } : {
        context: r.context,
        table: r.name,
        columns: structData.columns,
        sections: structData.sections
      };
    }
  }
  return null;
}

// lib/addTokenMeta.js
function getIDer() {
  let i = 1;
  return () => "fxg" + i++;
}
function sameValue(a, b) {
  if (a == null && b == null) {
    return true;
  }
  return a === b;
}
function sameArray(a, b) {
  if (Array.isArray(a) !== Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!sameValue(a[i], b[i])) {
      return false;
    }
  }
  return true;
}
function sameStr(a, b) {
  if (!a && !b) {
    return true;
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}
function isEquivalent(refA, refB) {
  if ((refA.name || refB.name) && refA.name !== refB.name) {
    return false;
  }
  if (refA.columns || refB.columns) {
    if (refA.table !== refB.table) {
      return false;
    }
    if (!sameArray(refA.columns, refB.columns)) {
      return false;
    }
    if (!sameArray(refA.sections, refB.sections)) {
      return false;
    }
  }
  if (refA.range || refB.range) {
    if (!sameValue(refA.range.top, refB.range.top) || !sameValue(refA.range.bottom, refB.range.bottom) || !sameValue(refA.range.left, refB.range.left) || !sameValue(refA.range.right, refB.range.right)) {
      return false;
    }
  }
  if (!sameStr(refA.workbookName, refB.workbookName) || !sameStr(refA.sheetName, refB.sheetName)) {
    return false;
  }
  return true;
}
function addContext(ref, sheetName, workbookName) {
  if (!ref.sheetName) {
    ref.sheetName = sheetName;
  }
  if (!ref.workbookName) {
    ref.workbookName = workbookName;
  }
  return ref;
}
function addTokenMeta(tokenlist, { sheetName = "", workbookName = "" } = {}) {
  const parenStack = [];
  let arrayStart = null;
  const uid = getIDer();
  const knownRefs = [];
  const getCurrDepth = () => parenStack.length + (arrayStart ? 1 : 0);
  tokenlist.forEach((token, i) => {
    token.index = i;
    token.depth = getCurrDepth();
    if (token.value === "(") {
      parenStack.push(token);
      token.depth = getCurrDepth();
    } else if (token.value === ")") {
      const counter = parenStack.pop();
      if (counter) {
        const pairId = uid();
        token.groupId = pairId;
        token.depth = counter.depth;
        counter.groupId = pairId;
      } else {
        token.error = true;
      }
    } else if (token.value === "{") {
      if (!arrayStart) {
        arrayStart = token;
        token.depth = getCurrDepth();
      } else {
        token.error = true;
      }
    } else if (token.value === "}") {
      if (arrayStart) {
        const pairId = uid();
        token.groupId = pairId;
        token.depth = arrayStart.depth;
        arrayStart.groupId = pairId;
      } else {
        token.error = true;
      }
      arrayStart = null;
    } else if (token.type === REF_RANGE || token.type === REF_BEAM || token.type === REF_TERNARY || token.type === REF_STRUCT) {
      const ref = token.type === REF_STRUCT ? parseStructRef(token.value, { xlsx: true }) : parseA1Ref(token.value, { allowTernary: true, xlsx: true });
      if (ref && (ref.range || ref.columns)) {
        ref.source = token.value;
        addContext(ref, sheetName, workbookName);
        const known = knownRefs.find((d) => isEquivalent(d, ref));
        if (known) {
          token.groupId = known.groupId;
        } else {
          ref.groupId = uid();
          token.groupId = ref.groupId;
          knownRefs.push(ref);
        }
      }
    } else if (token.type === UNKNOWN) {
      token.error = true;
    }
  });
  return tokenlist;
}

// lib/rc.js
var clamp2 = (min, val, max) => Math.min(Math.max(val, min), max);
function toCoord(value, isAbs) {
  if (isAbs) {
    return String(value + 1);
  }
  return value ? "[" + value + "]" : "";
}
function trimDirection(head, tail) {
  if (head && tail) {
    return "both";
  }
  if (head) {
    return "head";
  }
  if (tail) {
    return "tail";
  }
}
function toR1C1(range) {
  let { r0, c0, r1, c1 } = range;
  const { $c0, $c1, $r0, $r1 } = range;
  const nullR0 = r0 == null;
  const nullC0 = c0 == null;
  let nullR1 = r1 == null;
  let nullC1 = c1 == null;
  const op = rangeOperator(range.trim);
  const hasTrim = !!range.trim;
  r0 = clamp2($r0 ? 0 : -MAX_ROWS, r0 | 0, MAX_ROWS);
  c0 = clamp2($c0 ? 0 : -MAX_COLS, c0 | 0, MAX_COLS);
  if (!nullR0 && nullR1 && !nullC0 && nullC1) {
    r1 = r0;
    nullR1 = false;
    c1 = c0;
    nullC1 = false;
  } else {
    r1 = clamp2($r1 ? 0 : -MAX_ROWS, r1 | 0, MAX_ROWS);
    c1 = clamp2($c1 ? 0 : -MAX_COLS, c1 | 0, MAX_COLS);
  }
  const allRows = r0 === 0 && r1 >= MAX_ROWS;
  if (allRows && !nullC0 && !nullC1 || nullR0 && nullR1) {
    const a = toCoord(c0, $c0);
    const b = toCoord(c1, $c1);
    return "C" + (a === b && !hasTrim ? a : a + op + "C" + b);
  }
  const allCols = c0 === 0 && c1 >= MAX_COLS;
  if (allCols && !nullR0 && !nullR1 || nullC0 && nullC1) {
    const a = toCoord(r0, $r0);
    const b = toCoord(r1, $r1);
    return "R" + (a === b && !hasTrim ? a : a + op + "R" + b);
  }
  const s_r0 = toCoord(r0, $r0);
  const s_r1 = toCoord(r1, $r1);
  const s_c0 = toCoord(c0, $c0);
  const s_c1 = toCoord(c1, $c1);
  if (nullR0 || nullR1 || nullC0 || nullC1) {
    return (nullR0 ? "" : "R" + s_r0) + (nullC0 ? "" : "C" + s_c0) + op + (nullR1 ? "" : "R" + s_r1) + (nullC1 ? "" : "C" + s_c1);
  }
  if (s_r0 !== s_r1 || s_c0 !== s_c1) {
    return "R" + s_r0 + "C" + s_c0 + op + "R" + s_r1 + "C" + s_c1;
  }
  return "R" + s_r0 + "C" + s_c0;
}
function parseR1C1Part(ref) {
  let r0 = null;
  let c0 = null;
  let $r0 = null;
  let $c0 = null;
  const rm = /^R(?:\[([+-]?\d+)\]|(\d+))?/.exec(ref);
  if (rm) {
    if (rm[1]) {
      r0 = parseInt(rm[1], 10);
      $r0 = false;
    } else if (rm[2]) {
      r0 = parseInt(rm[2], 10) - 1;
      $r0 = true;
    } else {
      r0 = 0;
      $r0 = false;
    }
    ref = ref.slice(rm[0].length);
  }
  const cm = /^C(?:\[([+-]?\d+)\]|(\d+))?/.exec(ref);
  if (cm) {
    if (cm[1]) {
      c0 = parseInt(cm[1], 10);
      $c0 = false;
    } else if (cm[2]) {
      c0 = parseInt(cm[2], 10) - 1;
      $c0 = true;
    } else {
      c0 = 0;
      $c0 = false;
    }
    ref = ref.slice(cm[0].length);
  }
  if (!rm && !cm || ref.length) {
    return null;
  }
  return [r0, c0, $r0, $c0];
}
function fromR1C1(rangeString) {
  let final = null;
  const [part1, op, part2, overflow] = rangeString.split(/(\.?:\.?)/);
  if (overflow) {
    return null;
  }
  const range = parseR1C1Part(part1);
  const trim = trimDirection(!!op && op[0] === ".", !!op && op[op.length - 1] === ".");
  if (range) {
    const [r0, c0, $r0, $c0] = range;
    if (part2) {
      const extendTo = parseR1C1Part(part2);
      if (extendTo) {
        final = {};
        const [r1, c1, $r1, $c1] = extendTo;
        if (r0 != null && r1 != null) {
          final.r0 = $r0 === $r1 ? Math.min(r0, r1) : r0;
          final.$r0 = $r0;
          final.r1 = $r0 === $r1 ? Math.max(r0, r1) : r1;
          final.$r1 = $r1;
        } else if (r0 != null && r1 == null) {
          final.r0 = r0;
          final.$r0 = $r0;
          final.r1 = null;
          final.$r1 = $r0;
        } else if (r0 == null && r1 != null) {
          final.r0 = r1;
          final.$r0 = $r1;
          final.r1 = null;
          final.$r1 = $r1;
        } else if (r0 == null && r1 == null) {
          final.r0 = null;
          final.$r0 = false;
          final.r1 = null;
          final.$r1 = false;
        }
        if (c0 != null && c1 != null) {
          final.c0 = $c0 === $c1 ? Math.min(c0, c1) : c0;
          final.$c0 = $c0;
          final.c1 = $c0 === $c1 ? Math.max(c0, c1) : c1;
          final.$c1 = $c1;
        } else if (c0 != null && c1 == null) {
          final.c0 = c0;
          final.$c0 = $c0;
          final.c1 = null;
          final.$c1 = $c0;
        } else if (c0 == null && c1 != null) {
          final.c0 = c1;
          final.$c0 = $c1;
          final.c1 = null;
          final.$c1 = $c1;
        } else if (c0 == null && c1 == null) {
          final.c0 = null;
          final.$c0 = false;
          final.c1 = null;
          final.$c1 = false;
        }
      } else {
        return null;
      }
    } else if (r0 != null && c0 == null) {
      final = {
        r0,
        c0: null,
        r1: r0,
        c1: null,
        $r0,
        $c0: false,
        $r1: $r0,
        $c1: false
      };
    } else if (r0 == null && c0 != null) {
      final = {
        r0: null,
        c0,
        r1: null,
        c1: c0,
        $r0: false,
        $c0,
        $r1: false,
        $c1: $c0
      };
    } else {
      final = {
        r0: r0 || 0,
        c0: c0 || 0,
        r1: r0 || 0,
        c1: c0 || 0,
        $r0: $r0 || false,
        $c0: $c0 || false,
        $r1: $r0 || false,
        $c1: $c0 || false
      };
    }
  }
  if (final && trim) {
    final.trim = trim;
  }
  return final;
}
function parseR1C1Ref(refString, { allowNamed = true, allowTernary = false, xlsx = false } = {}) {
  const d = parseRef(refString, { allowNamed, allowTernary, xlsx, r1c1: true });
  if (d && (d.r0 || d.name)) {
    const range = d.r1 ? fromR1C1(d.r0 + d.operator + d.r1) : fromR1C1(d.r0);
    if (range) {
      return xlsx ? { workbookName: d.workbookName, sheetName: d.sheetName, range } : { context: d.context, range };
    }
    if (d.name) {
      return xlsx ? { workbookName: d.workbookName, sheetName: d.sheetName, name: d.name } : { context: d.context, name: d.name };
    }
    return null;
  }
  return null;
}
function stringifyR1C1Ref(refObject, { xlsx = false } = {}) {
  const prefix2 = xlsx ? stringifyPrefixAlt(refObject) : stringifyPrefix(refObject);
  return prefix2 + (refObject.name ? refObject.name : toR1C1(refObject.range));
}

// lib/translate.js
var calc = (abs, vX, aX) => {
  if (vX == null) {
    return null;
  }
  return abs ? vX : vX - aX;
};
function tokensToString(tokens2) {
  let s = "";
  for (const token of tokens2) {
    s += token.value;
  }
  return s;
}
function cloneToken(token) {
  const newToken = {
    type: token.type,
    value: token.value
  };
  if (token.loc) {
    newToken.loc = token.loc;
  }
  if (token.unterminated != null) {
    newToken.unterminated = token.unterminated;
  }
  if (token.index != null) {
    newToken.index = token.index;
    if (token.groupId) {
      newToken.groupId = token.groupId;
    }
    if (token.depth != null) {
      newToken.depth = token.depth;
    }
    if (token.error) {
      newToken.error = token.error;
    }
  }
  return newToken;
}
function translateToR1C1(formula, anchorCell, { xlsx = false, allowTernary = true } = {}) {
  const anchorRange = fromA1(anchorCell);
  if (!anchorRange) {
    throw new Error("translateToR1C1 got an invalid anchorCell: " + anchorCell);
  }
  const { top, left } = anchorRange;
  const isString = typeof formula === "string";
  const tokens2 = isString ? tokenize(formula, { withLocation: false, mergeRefs: false, r1c1: false, xlsx, allowTernary }) : formula;
  let offsetSkew = 0;
  const refOpts = { xlsx, allowTernary };
  const outTokens = [];
  for (let token of tokens2) {
    if (isRange(token)) {
      token = cloneToken(token);
      const tokenValue = token.value;
      const ref = parseA1Ref(tokenValue, refOpts);
      const d = ref.range;
      const range = {};
      range.r0 = calc(d.$top, d.top, top);
      range.r1 = calc(d.$bottom, d.bottom, top);
      range.c0 = calc(d.$left, d.left, left);
      range.c1 = calc(d.$right, d.right, left);
      range.$r0 = d.$top;
      range.$r1 = d.$bottom;
      range.$c0 = d.$left;
      range.$c1 = d.$right;
      if (d.trim) {
        range.trim = d.trim;
      }
      ref.range = range;
      token.value = stringifyR1C1Ref(ref, refOpts);
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    } else if (offsetSkew && token.loc && !isString) {
      token = cloneToken(token);
      token.loc[0] += offsetSkew;
      token.loc[1] += offsetSkew;
    }
    outTokens[outTokens.length] = token;
  }
  return isString ? tokensToString(outTokens) : outTokens;
}
function toFixed(val, abs, base, max, wrapEdges = true) {
  let v = val;
  if (v != null && !abs) {
    v = base + val;
    if (v < 0) {
      if (!wrapEdges) {
        return NaN;
      }
      v = max + v + 1;
    }
    if (v > max) {
      if (!wrapEdges) {
        return NaN;
      }
      v -= max + 1;
    }
  }
  return v;
}
function translateToA1(formula, anchorCell, options = {}) {
  const anchorRange = fromA1(anchorCell);
  if (!anchorRange) {
    throw new Error("translateToR1C1 got an invalid anchorCell: " + anchorCell);
  }
  const { top, left } = anchorRange;
  const isString = typeof formula === "string";
  const {
    wrapEdges = true,
    mergeRefs = true,
    allowTernary = true,
    xlsx = false
  } = options;
  const tokens2 = isString ? tokenize(formula, {
    withLocation: false,
    mergeRefs,
    xlsx,
    allowTernary,
    r1c1: true
  }) : formula;
  let offsetSkew = 0;
  const refOpts = { xlsx, allowTernary };
  const outTokens = [];
  for (let token of tokens2) {
    if (isRange(token)) {
      token = cloneToken(token);
      const tokenValue = token.value;
      const ref = parseR1C1Ref(tokenValue, refOpts);
      const d = ref.range;
      const range = {};
      const r0 = toFixed(d.r0, d.$r0, top, MAX_ROWS, wrapEdges);
      const r1 = toFixed(d.r1, d.$r1, top, MAX_ROWS, wrapEdges);
      if (r0 > r1) {
        range.top = r1;
        range.$top = d.$r1;
        range.bottom = r0;
        range.$bottom = d.$r0;
      } else {
        range.top = r0;
        range.$top = d.$r0;
        range.bottom = r1;
        range.$bottom = d.$r1;
      }
      const c0 = toFixed(d.c0, d.$c0, left, MAX_COLS, wrapEdges);
      const c1 = toFixed(d.c1, d.$c1, left, MAX_COLS, wrapEdges);
      if (c0 > c1) {
        range.left = c1;
        range.$left = d.$c1;
        range.right = c0;
        range.$right = d.$c0;
      } else {
        range.left = c0;
        range.$left = d.$c0;
        range.right = c1;
        range.$right = d.$c1;
      }
      if (d.trim) {
        range.trim = d.trim;
      }
      if (isNaN(r0) || isNaN(r1) || isNaN(c0) || isNaN(c1)) {
        token.type = ERROR;
        token.value = "#REF!";
        delete token.groupId;
      } else {
        ref.range = range;
        token.value = stringifyA1Ref(ref, refOpts);
      }
      if (token.loc) {
        token.loc[0] += offsetSkew;
        offsetSkew += token.value.length - tokenValue.length;
        token.loc[1] += offsetSkew;
      }
    } else if (offsetSkew && token.loc && !isString) {
      token = cloneToken(token);
      token.loc[0] += offsetSkew;
      token.loc[1] += offsetSkew;
    }
    outTokens[outTokens.length] = token;
  }
  return isString ? tokensToString(outTokens) : outTokens;
}

// lib/stringifyStructRef.js
function quoteColname(str) {
  return str.replace(/([[\]#'@])/g, "'$1");
}
function needsBraces(str) {
  return !/^[a-zA-Z0-9\u00a1-\uffff]+$/.test(str);
}
function toSentenceCase(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
function stringifyStructRef(refObject, options = {}) {
  const { xlsx, thisRow } = options;
  let s = xlsx ? stringifyPrefixAlt(refObject) : stringifyPrefix(refObject);
  if (refObject.table) {
    s += refObject.table;
  }
  const numColumns = refObject.columns?.length ?? 0;
  const numSections = refObject.sections?.length ?? 0;
  if (numSections === 1 && !numColumns) {
    s += `[#${toSentenceCase(refObject.sections[0])}]`;
  } else if (!numSections && numColumns === 1) {
    s += `[${quoteColname(refObject.columns[0])}]`;
  } else {
    s += "[";
    const singleAt = !thisRow && numSections === 1 && refObject.sections[0].toLowerCase() === "this row";
    if (singleAt) {
      s += "@";
    } else if (numSections) {
      s += refObject.sections.map((d) => `[#${toSentenceCase(d)}]`).join(",");
      if (numColumns) {
        s += ",";
      }
    }
    if (singleAt && refObject.columns.length === 1 && !needsBraces(refObject.columns[0])) {
      s += quoteColname(refObject.columns[0]);
    } else if (numColumns) {
      s += refObject.columns.slice(0, 2).map((d) => `[${quoteColname(d)}]`).join(":");
    }
    s += "]";
  }
  return s;
}

// lib/fixRanges.js
function fixRanges(formula, options = { addBounds: false }) {
  if (typeof formula === "string") {
    return fixRanges(tokenize(formula, options), options).map((d) => d.value).join("");
  }
  if (!Array.isArray(formula)) {
    throw new Error("fixRanges expects an array of tokens");
  }
  const { addBounds, r1c1, xlsx, thisRow } = options;
  if (r1c1) {
    throw new Error("fixRanges does not have an R1C1 mode");
  }
  let offsetSkew = 0;
  return formula.map((t) => {
    const token = { ...t };
    if (t.loc) {
      token.loc = [...t.loc];
    }
    let offsetDelta = 0;
    if (token.type === REF_STRUCT) {
      const sref = parseStructRef(token.value, { xlsx });
      const newValue = stringifyStructRef(sref, { xlsx, thisRow });
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    } else if (isRange(token)) {
      const ref = parseA1Ref(token.value, { xlsx, allowTernary: true });
      const range = ref.range;
      if (addBounds) {
        addA1RangeBounds(range);
      }
      const newValue = stringifyA1Ref(ref, { xlsx });
      offsetDelta = newValue.length - token.value.length;
      token.value = newValue;
    }
    if (offsetSkew || offsetDelta) {
      if (token.loc) {
        token.loc[0] += offsetSkew;
      }
      offsetSkew += offsetDelta;
      if (token.loc) {
        token.loc[1] += offsetSkew;
      }
    } else {
      offsetSkew += offsetDelta;
    }
    return token;
  });
}

// lib/fromCol.js
function fromCol(columnString) {
  const x = columnString || "";
  const l = x.length;
  let n = 0;
  if (l > 2) {
    const c = x.charCodeAt(l - 3);
    const a = c > 95 ? 32 : 0;
    n += (1 + c - a - 65) * 676;
  }
  if (l > 1) {
    const c = x.charCodeAt(l - 2);
    const a = c > 95 ? 32 : 0;
    n += (1 + c - a - 65) * 26;
  }
  if (l) {
    const c = x.charCodeAt(l - 1);
    const a = c > 95 ? 32 : 0;
    n += c - a - 65;
  }
  return n;
}

// lib/index.js
var tokenTypes = Object.freeze({
  OPERATOR,
  BOOLEAN,
  ERROR,
  NUMBER,
  FUNCTION,
  NEWLINE,
  WHITESPACE,
  STRING,
  CONTEXT,
  CONTEXT_QUOTE,
  REF_RANGE,
  REF_BEAM,
  REF_TERNARY,
  REF_NAMED,
  REF_STRUCT,
  FX_PREFIX,
  UNKNOWN
});
var nodeTypes = Object.freeze({
  UNARY,
  BINARY,
  REFERENCE,
  LITERAL,
  ERROR: ERROR_LITERAL,
  CALL,
  ARRAY,
  IDENTIFIER
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MAX_COLS,
  MAX_ROWS,
  addA1RangeBounds,
  addTokenMeta,
  fixRanges,
  fromCol,
  isError,
  isFunction,
  isFxPrefix,
  isLiteral,
  isOperator,
  isRange,
  isReference,
  isWhitespace,
  mergeRefTokens,
  nodeTypes,
  parse,
  parseA1Ref,
  parseR1C1Ref,
  parseStructRef,
  stringifyA1Ref,
  stringifyR1C1Ref,
  stringifyStructRef,
  toCol,
  tokenTypes,
  tokenize,
  translateToA1,
  translateToR1C1
});
//# sourceMappingURL=index.cjs.map