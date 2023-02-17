const reBannedChars = /[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;

export function stringifyPrefix (ref) {
  let pre = '';
  let quote = 0;
  let nth = 0;
  const context = ref.context || [];
  for (let i = context.length; i > -1; i--) {
    const scope = context[i];
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
