# References and Ranges

In Excels spreadsheet formula language terminology, a reference is similar to what is in most programming is called a variable. Spreadsheets do not have variables though, they have cells. The cells can be referenced in formulas, either directly (such as `=SUM(A1)`), or through aliases (such as `=SUM(someName)`).

A range is when a cell, or a set of cells, is referenced directly. Ranges in formulas can come in one of two syntax styles: The commonly known A1 style, as well as R1C1 style where both axes are numerical. Only one style can be used at a time in a formula.

## Ranges

This tokenizer considers there to be three "types" of ranges:

### Ranges (`REF_RANGE`)

The basic type of range will be referencing either:

* A single cell, like `A1` or `AF31`.
* A bounded rectangle of cells, like `A1:B2` or `AF17:AF31`.

### Range ternary (`REF_TERNARY`)

Ternary ranges are rectangles of cells defined by only three of the four possible sides. They are are unbounded in either bottom or right dimension:

* A rectangle of cells that is unbounded to the bottom, like `A1:A` or `C3:D`.
* A rectangle of cells that is unbounded to the right, like `A1:1` or `F2:5`.

This type of range is not supported in Excel, so it is an opt-in for the tokenizer (see [README.md](./README.md)).

### Range beams (`REF_BEAM`)

Range beams are rectangles of cells that are unbounded in either left and right, or top and bottom dimensions.

* A rectangle of cells that is unbounded to the top and bottom, like `A:A` or `C:D`.
* A rectangle of cells that is unbounded to the left and right, like `1:1` or `2:5`.


## References

As well as ranges, a reference can be either of:

### Named Ranges or Names  (`REF_NAMED`)

[Named Ranges][named], or Names as Excel prefers to call them most of the time, are usually a references to a range or table but may also be references to entire expressions.

### Structured references (`REF_STRUCT`)

[Structured references][srefs] are references into an area or slice of a table. They can include the table name (which is essentially a Name), as well as either or both of a section directive and/or column name or a range of columns.

* A structured reference to a column: `Table1[Column1]`
* A structured reference to the tables totals: `Table1[#Totals]`
* A structured reference to a range of columns: `[[Column1]:[Column3]]`
* A structured reference to a specific column of a tables totals: `Table1[[#Totals],[Column2]]`

---

Spreadsheet applications will normalize all ranges when you enter a formula, flipping the left/right and top/bottom coordinates as needed to keep the range top to bottom and left to right. Structured references will also be normalized as appropriate.

The library has tools to both normalize the ranges, as well as filling in the missing boundaries (see [README.md](./README.md)).


[named]: https://support.microsoft.com/en-us/office/define-and-use-names-in-formulas-4d0f13ac-53b7-422e-afd2-abd7ff379c64
[srefs]: https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e
