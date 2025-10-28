const charFrom = String.fromCharCode;

/**
 * Convert a 0 based offset number to a column string
 * representation (`2` = `"C"`).
 *
 * The method expects a number between 0 and 16383. Other input will
 * return garbage.
 *
 * @param {number} columnIndex Zero based column index number
 * @returns {string} The column string identifier
 */
export function toCol (columnIndex: number): string {
  return (
    (columnIndex >= 702
      ? charFrom(((((columnIndex - 702) / 676) - 0) % 26) + 65)
      : '') +
    (columnIndex >= 26
      ? charFrom(((((columnIndex / 26) - 1) % 26) + 65))
      : '') +
    charFrom((columnIndex % 26) + 65)
  );
}
