import { test, Test } from 'tape';
import { translateToR1C1, translateToA1 } from './translate.js';

Test.prototype.okayRoundTrip = function roundTrip (expr, anchor, options) {
  const rc = translateToR1C1(expr, anchor, options);
  const a1 = translateToA1(rc, anchor, options);
  this.is(a1, expr, 'Round trip: ' + expr);
};

test('translate absolute cells from A1 to RC', t => {
  t.okayRoundTrip('=Sheet1!$1:$1048576', 'A1');
  t.okayRoundTrip('=D$1:$BJ$1048576', 'A1');
  t.okayRoundTrip('=VLOOKUP(C7,Röðun,4,0)', 'A1');
  t.okayRoundTrip('=COUNTIF(B$1442:B$1048576,$G1442)', 'A1');
  t.okayRoundTrip('=IF(p2m<=D5,10,0)*scene_spend', 'A1');
  t.okayRoundTrip('=(kwh_used_daily*kwhbtu*co2btu)/1000000', 'A1');
  t.okayRoundTrip('=NOPLATT1+g1_+ROIC1+WACC+G1+g1_+G130+ROIC2+WACC+g2_+WACC+N', 'A1');
  // FIXME: translate needs to be be able to specify allowTernary=false
  t.okayRoundTrip('=foo:C3:D4', 'A1', { allowTernary: false });
  t.end();
});
