import { test, Test } from 'tape';
import { translateToRC } from './translate.js';

Test.prototype.isA2R = function isTokens (expr, anchor, result) {
  this.is(translateToRC(expr, anchor), result, expr);
};

test('translate absolute cells from A1 to RC', t => {
  t.isA2R('=$A$1', 'B2', '=R1C1');
  t.isA2R('=$A$2', 'B2', '=R2C1');
  t.isA2R('=$A$3', 'B2', '=R3C1');
  t.isA2R('=$B$1', 'B2', '=R1C2');
  t.isA2R('=$B$2', 'B2', '=R2C2');
  t.isA2R('=$B$3', 'B2', '=R3C2');
  t.isA2R('=$C$1', 'B2', '=R1C3');
  t.isA2R('=$C$2', 'B2', '=R2C3');
  t.isA2R('=$C$3', 'B2', '=R3C3');
  // absolute cells, anchor has no real effect
  t.isA2R('=$A$1', 'Z19', '=R1C1');
  t.isA2R('=$A$2', 'Z19', '=R2C1');
  t.isA2R('=$A$3', 'Z19', '=R3C1');
  t.isA2R('=$B$1', 'Z19', '=R1C2');
  t.isA2R('=$B$2', 'Z19', '=R2C2');
  t.isA2R('=$B$3', 'Z19', '=R3C2');
  t.isA2R('=$C$1', 'Z19', '=R1C3');
  t.isA2R('=$C$2', 'Z19', '=R2C3');
  t.isA2R('=$C$3', 'Z19', '=R3C3');
  t.end();
});

test('translate relative cells from A1 to RC', t => {
  t.isA2R('=A1', 'B2', '=R[-1]C[-1]');
  t.isA2R('=A2', 'B2', '=RC[-1]');
  t.isA2R('=A3', 'B2', '=R[1]C[-1]');
  t.isA2R('=B1', 'B2', '=R[-1]C');
  t.isA2R('=B2', 'B2', '=RC');
  t.isA2R('=B3', 'B2', '=R[1]C');
  t.isA2R('=C1', 'B2', '=R[-1]C[1]');
  t.isA2R('=C2', 'B2', '=RC[1]');
  t.isA2R('=C3', 'B2', '=R[1]C[1]');
  // relative cells, but with [0] notation
  t.isA2R('=H11', 'I12', '=R[-1]C[-1]');
  t.isA2R('=H12', 'I12', '=RC[-1]');
  t.isA2R('=H13', 'I12', '=R[1]C[-1]');
  t.isA2R('=I11', 'I12', '=R[-1]C');
  t.isA2R('=I12', 'I12', '=RC');
  t.isA2R('=I13', 'I12', '=R[1]C');
  t.isA2R('=J11', 'I12', '=R[-1]C[1]');
  t.isA2R('=J12', 'I12', '=RC[1]');
  t.isA2R('=J13', 'I12', '=R[1]C[1]');
  t.end();
});

test('translate rows from A1 to RC', t => {
  t.isA2R('=2:2', 'B1', '=R[1]');
  t.isA2R('=2:2', 'B2', '=R');
  t.isA2R('=2:2', 'B3', '=R[-1]');
  t.isA2R('=13:13', 'B13', '=R');
  t.isA2R('=$2:$2', 'B2', '=R2');
  t.isA2R('=2:$2', 'B2', '=R:R2');
  t.isA2R('=11:9', 'Z10', '=R[-1]:R[1]');
  t.end();
});

test('translate cols from A1 to RC', t => {
  t.isA2R('=B:B', 'A2', '=C[1]');
  t.isA2R('=B:B', 'B2', '=C');
  t.isA2R('=B:B', 'C2', '=C[-1]');
  t.isA2R('=Z:Z', 'Z2', '=C');
  t.isA2R('=B:B', 'B2', '=C');
  t.isA2R('=$B:$B', 'B2', '=C2');
  t.isA2R('=B:$B', 'B2', '=C:C2');
  t.isA2R('=N:L', 'M10', '=C[-1]:C[1]');
  t.end();
});

test('translate partials from A1 to RC', t => {
  t.isA2R('=A1:A', 'C6', '=R[-5]C[-2]:C[-2]');
  t.isA2R('=A1:1', 'D6', '=R[-5]C[-3]:R[-5]');
  t.isA2R('=$A1:$A', 'C7', '=R[-6]C1:C1');
  t.isA2R('=$A:$A1', 'D7', '=R[-6]C1:C1');
  t.isA2R('=$A1:1', 'C7', '=R[-6]C1:R[-6]');
  t.isA2R('=1:$A1', 'C7', '=R[-6]C1:R[-6]');
  t.isA2R('=A$1:A', 'C6', '=R1C[-2]:C[-2]');
  t.isA2R('=A:A$1', 'C6', '=R1C[-2]:C[-2]');
  t.isA2R('=A$1:$1', 'D6', '=R1C[-3]:R1');
  t.isA2R('=$1:A$1', 'D6', '=R1C[-3]:R1');
  t.isA2R('=$A$1:$A', 'D6', '=R1C1:C1');
  t.isA2R('=$A:$A$1', 'D6', '=R1C1:C1');
  t.isA2R('=$A$1:$1', 'D6', '=R1C1:R1');
  t.isA2R('=$1:$A$1', 'D6', '=R1C1:R1');
  t.end();
});

test('translate out of boundary coords from A1 to RC', t => {
  t.isA2R('=XFD:XFD', 'A1', '=C[16383]');
  t.isA2R('=A1', 'B1', '=RC[-1]');
  t.isA2R('=B1', 'C1', '=RC[-1]');
  t.isA2R('=1048576:1048576', 'A1', '=R[1048575]');
  t.isA2R('=A1', 'A2', '=R[-1]C');
  t.isA2R('=A2', 'A3', '=R[-1]C');
  t.end();
});

test('translate mixed rel/abs coords from A1 to RC', t => {
  t.isA2R('=B$1', 'B2', '=R1C');
  t.isA2R('=$D8', 'B4', '=R[4]C4');
  t.isA2R('=8:$10', 'B4', '=R[4]:R10');
  t.isA2R('=$J:L', 'B4', '=C10:C[10]');
  t.isA2R('=$A$1:$B$2', 'D4', '=R1C1:R2C2');
  t.isA2R('=C3:F6', 'D4', '=R[-1]C[-1]:R[2]C[2]');
  t.end();
});

test('translate involved formula from A1 to RC', t => {
  t.isA2R('=SUM(IF(E10,$E$2,$E$3),Sheet1!$2:$2*Sheet2!B:B)', 'D10',
    '=SUM(IF(RC[1],R2C5,R3C5),Sheet1!R2*Sheet2!C[-2])');
  t.end();
});
