const reBannedChars = /[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;

export function stringifyPrefix (ref) {
  const { workbookName, sheetName } = ref;
  let pre = '';
  let quote = 0;
  const scopes = [ sheetName, workbookName ];
  let nth = 0;
  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes[i];
    if (scope) {
      const part = (nth % 2) ? '[' + scope + ']' : scope;
      pre = part + pre;
      quote += reBannedChars.test(scope);
      nth++;
    }
  }
  if (quote) {
    pre = "'" + pre.replace(/'/g, "''") + "'";
  }
  return pre ? pre + '!' : pre;
}
