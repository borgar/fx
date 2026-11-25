const VLQ_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

// VLQ compressed "needs quote in prefix" state for all chars up to 0xffff. Above that Excel does not trigger escaping.
const ESC_STATE = 'xe11a7q411qx61212211211c1Njhyfh3d824114313111k1yj1Ag1B81x6216x98h1n13111211br44xcxnaa4z61xbfxs2z5ox' +
  '192415m419131np7b5o16hxaxnxp2i253c2a1j18222m1711342922248142152l115126422m1712121221154223b4117fc319131m1712152a13132' +
  '1f24a917318222m1712152832238242134ia216331432111232333c4533142161ede318131n1g381314721321224a87111218131n1a1538131472' +
  '62124a12fb131x92723155e4j16221i3o19112731461118i2dxq4g1ax7211151o111j132511162a24x04fx74a1x44k17381x41f21xgxb17345b6e' +
  '3132734dc1hx611512xb1Gd142711142x9142x1142711142f1xp142y3ek3ggym263Pc2xc5yb3b7idjeied13fyk31323a6ah41a6yp7xb5y6avxhu2' +
  '5bxc4qg1x5n9xlyi1ytxfh8xmud2axcqx4x93ax42b5xb23x941612315C0y0Em262x626281111111v2xl1f1e261j23191h241222223c12115181x5' +
  '8292e3d3gx0ksxr1455411xq6z4cDiex92yh1uz5x7pblFmayo8k5ypAf4142s1x31114311727ev3o1ey1E0U0D56432912x611512xo71gn97171717' +
  '17171717yg1ygq1ypcD0gx85j1c121ym271yv5xb1yu1xgxgxd3x4481xb3yd4xf1zn4z32v1CK0y0RQd3i2g1c13119xe2Ed3ga2kxfgv2ygx792z72y' +
  '3221118lg13141nd6axkexixu63112bsanpt7xfs1g51aa51x9n318kn313xi1132252111o32b73c6262697171xb1e6zjtGZ4cn4xh4EPe2zax67c55' +
  'q151112121zcx1Hbiy02xm8xcx44c21i4a141e14451A7211yu2yu362626233717a7';

// build a map of characters to allow-bitmasks, indexed by char code
export const ALLOWED = new Uint8Array(0x10000);
export const OK_NAME_0 = 0b0000001;
export const OK_FUNC_0 = 0b0000010;
export const OK_CNTX_0 = 0b0000100;
export const OK_NAME_N = 0b0001000;
export const OK_FUNC_N = 0b0010000;
export const OK_CNTX_N = 0b0100000;
const OK_PREFIX = 0b1000000;
export const OK_0 = OK_NAME_0 | OK_FUNC_0 | OK_CNTX_0;
export const OK_N = OK_NAME_N | OK_FUNC_N | OK_CNTX_N;
const OK_HIGHCHAR = OK_NAME_0 | OK_NAME_N | OK_CNTX_0 | OK_CNTX_N;
ALLOWED.fill(OK_HIGHCHAR, 180);
for (let c = 0; c < 180; c++) {
  const char = String.fromCharCode(c);
  const n0 = /^[a-zA-Z_\\\u00a1-\uffff]$/.test(char);
  const f0 = /^[a-zA-Z_]$/.test(char);
  const nN = /^[a-zA-Z0-9_.\\?\u00a1-\uffff]$/.test(char);
  const fN = /^[a-zA-Z0-9_.]$/.test(char);
  const cX = /^[a-zA-Z0-9_.¡¤§¨ª\u00ad¯-\uffff]$/.test(char);
  const cN = cX;
  ALLOWED[c] = (
    (n0 ? OK_NAME_0 : 0) |
    (nN ? OK_NAME_N : 0) |
    (f0 ? OK_FUNC_0 : 0) |
    (fN ? OK_FUNC_N : 0) |
    (cX ? OK_CNTX_0 : 0) |
    (cN ? OK_CNTX_N : 0)
  );
}

// Reads alternating run lengths of disallowed and allowed state, starting
// with disallowed, and sets OK_PREFIX in ALLOWED for every allowed character.
{
  let allowed = false;
  let pos = 0;
  let n = 0;
  for (const c of ESC_STATE) {
    const v = VLQ_ALPHABET.indexOf(c);
    n = (n << 5) | (v & 31);
    if (v < 32) {
      if (allowed) {
        for (let i = pos; i < pos + n; i++) {
          ALLOWED[i] |= OK_PREFIX;
        }
      }
      pos += n;
      allowed = !allowed;
      n = 0;
    }
  }
}

export function charNeedsEscape (s: number): boolean {
  if (s > 0xffff) return false;
  return !(ALLOWED[s] & OK_PREFIX);
}

export function isIdentityChar (s: number) {
  return (ALLOWED[s] & OK_0);
}

export function isOkayNameChar (s: number, nth = 1) {
  const a = ALLOWED[s];
  return nth ? (a & OK_NAME_N) : (a & OK_NAME_0);
}

export function isOkayContextChar (s: number, nth = 1) {
  const a = ALLOWED[s];
  return nth ? (a & OK_CNTX_N) : (a & OK_CNTX_N);
}
