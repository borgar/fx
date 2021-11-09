export function quickVerifyRangeA1 (tokenValue) {
  // Quickly determine if range valus are out of bounds: Split the string into
  // numeric, alphabetical, and "other" chunks and parse them as base 36 numbers.
  // Both rows and cols can be represented in base 36 and we can decide which we
  // hold by checking if the chunk was already a finite number. So we can simply
  // compare against the base 36 parsed versions of XFD and 1048576.
  return tokenValue.split(/(\d+|[a-zA-Z]+)/).every(d => {
    const n = parseInt(d, 36);
    if (!isNaN(n)) {
      return isFinite(d)
        ? n <= 2183880786 // max rows
        : n <= 43321;     // max cols
    }
    return true;
  });
}

const bounds = {
  'R': 1048577,
  'R[': 1048576,
  'C': 16385,
  'C[': 16384
};
export function quickVerifyRangeRC (tokenValue) {
  const reNums = /([RC]\[?)(-?\d+)/gi;
  let m;
  while ((m = reNums.exec(tokenValue)) !== null) {
    const x = bounds[m[1]];
    const val = parseInt(m[2], 10);
    if (val >= x || val <= -x) {
      return false;
    }
  }
  return true;
}
