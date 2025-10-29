/**
 * A formula language token.
 */
export type Token = Record<string, unknown> & {
  /** The type of the token */
  type: string;
  /** The value of the token */
  value: string;
  /** Signifies an unterminated string token */
  unterminated?: boolean;
  /** Source position offsets to the token */
  loc?: number[];
};

/**
 * A token with extra meta data.
 */
export type TokenEnhanced = Token & {
  /** A zero based position in a token list */
  index: number;
  /** The ID of a group which this token belongs (e.g. matching parens) */
  groupId?: string;
  /** This token's level of nesting inside parentheses */
  depth?: number;
  /** Token is of unknown type or a paren without a match */
  error?: boolean;
};

/**
 * A range in R1C1 style coordinates.
 */
export type RangeR1C1 = {
  /** Top row of the range */
  r0?: number | null;
  /** Bottom row of the range */
  r1?: number | null;
  /** Left column of the range */
  c0?: number | null;
  /** Right column of the range */
  c1?: number | null;
  /** Signifies that r0 is an absolute value */
  $r0?: boolean | null;
  /** Signifies that r1 is an absolute value */
  $r1?: boolean | null;
  /** Signifies that c0 is an absolute value */
  $c0?: boolean | null;
  /** Signifies that c1 is an absolute value */
  $c1?: boolean | null;
  /** Should empty rows and columns at the top/left or bottom/right be discarded when range is read? */
  trim?: 'head' | 'tail' | 'both' | null;
};

/**
 * A range in A1 style coordinates.
 */
export type RangeA1 = {
  /** Top row of the range */
  top: number | null;
  /** Left column of the range */
  left: number | null;
  /** Bottom row of the range */
  bottom?: number | null;
  /** Right column of the range */
  right?: number | null;
  /** Signifies that top is a "locked" value */
  $top?: boolean | null;
  /** Signifies that bottom is a "locked" value */
  $bottom?: boolean | null;
  /** Signifies that left is a "locked" value */
  $left?: boolean | null;
  /** Signifies that right is a "locked" value */
  $right?: boolean | null;
  /** Should empty rows and columns at the top/left or bottom/right be discarded when range is read? */
  trim?: 'head' | 'tail' | 'both' | null;
};

/**
 * A reference containing an A1 style range. See [Prefixes.md](Prefixes.md) for
 * documentation on how scopes work in Fx.
 */
export type ReferenceA1 = {
  /** A collection of scopes for the reference */
  context?: string[];
  /** The reference's range */
  range: RangeA1;
};

/**
 * A reference containing an A1 style range. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceA1Xlsx = {
  /** A context workbook scope */
  workbookName?: string;
  /** A context sheet scope */
  sheetName?: string;
  /** The reference's range */
  range: RangeA1;
};

/**
 * A reference containing a name. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceName = {
  /** A collection of scopes for the reference */
  context?: string[];
  /** The reference's name */
  name: string;
};

/**
 * A reference containing a name. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceNameXlsx = {
  /** A context workbook scope */
  workbookName?: string;
  /** A context sheet scope */
  sheetName?: string;
  /** The reference's name */
  name: string;
};

/**
 * A reference containing a R1C1 style range. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceR1C1 = {
  /** A collection of scopes for the reference */
  context?: string[];
  /** The reference's range */
  range: RangeR1C1;
};

/**
 * A reference containing a R1C1 style range. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceR1C1Xlsx = {
  /** A context workbook scope */
  workbookName?: string;
  /** A context sheet scope */
  sheetName?: string;
  /** The reference's range */
  range: RangeR1C1;
};

/**
 * A reference containing a table slice definition. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceStruct = {
  /** A collection of scopes for the reference */
  context?: string[];
  /** The sections this reference targets */
  sections?: string[];
  /** The sections this reference targets */
  columns?: string[];
  /** The table this reference targets */
  table?: string;
};

/**
 * A reference containing a table slice definition. See [Prefixes.md] for
 * documentation on how scopes work in Fx.
 */
export type ReferenceStructXlsx = {
  /** A context workbook scope */
  workbookName?: string;
  /** A context sheet scope */
  sheetName?: string;
  /** The sections this reference targets */
  sections?: string[];
  /** The sections this reference targets */
  columns?: string[];
  /** The table this reference targets */
  table?: string;
};
