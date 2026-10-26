// Run: node verify.mjs
// Sampled-input model only. Not a controller, I/O or complete SFC emulator.
import assert from 'node:assert/strict';

class PresenceTON {
  constructor() { this.since = null; this.acc = 0; this.dn = false; }
  scan(now, noSheet) {
    if (noSheet) { this.since = null; this.acc = 0; this.dn = false; }
    else {
      if (this.since === null) this.since = now;
      this.acc = Math.min(200, now - this.since);
      this.dn = this.acc >= 200;
    }
    return this.dn;
  }
}

function startCondition({ detected, system = true, downstream = true,
  space = true, lifted = false, liftUp = true, grip1 = true, grip2 = true,
  idle = true, single = false, robotClear = true, home = true }) {
  return ((system && detected && downstream && (space || lifted) && liftUp &&
    grip1 && grip2 && idle) || single) && robotClear && home;
}

const results = [];
function test(name, fn) { fn(); results.push({ name, result: 'PASS' }); }

test('Empty conveyor stays unconfirmed', () => {
  const t = new PresenceTON();
  for (let now = 0; now <= 1000; now += 10) {
    assert.equal(t.scan(now, true), false); assert.equal(t.acc, 0);
    assert.equal(startCondition({ detected: t.dn }), false);
  }
});

test('50/100/150/190 ms OFF pulses cannot qualify', () => {
  for (const duration of [50, 100, 150, 190]) {
    const t = new PresenceTON();
    for (let now = 0; now < duration; now += 10) assert.equal(t.scan(now, false), false);
    assert.equal(t.scan(duration, true), false); assert.equal(t.acc, 0);
  }
});

test('Repeated short pulses do not accumulate', () => {
  const t = new PresenceTON();
  for (let now = 0; now <= 3000; now += 10) assert.equal(t.scan(now, now % 200 >= 150), false);
});

test('Continuous presence qualifies at the sampled 200 ms boundary', () => {
  const t = new PresenceTON();
  for (let now = 0; now < 200; now += 10) assert.equal(t.scan(now, false), false);
  assert.equal(t.scan(200, false), true);
  assert.equal(t.scan(220, true), false); assert.equal(t.acc, 0);
});

test('A sampled interruption requires a new full confirmation interval', () => {
  const t = new PresenceTON();
  t.scan(0, false); t.scan(190, false); t.scan(200, true);
  assert.equal(t.scan(210, false), false);
  assert.equal(t.scan(400, false), false);
  assert.equal(t.scan(410, false), true);
});

test('Existing automatic interlocks still block qualified presence', () => {
  for (const key of ['system', 'downstream', 'liftUp', 'grip1', 'grip2', 'idle', 'robotClear', 'home']) {
    assert.equal(startCondition({ detected: true, [key]: false }), false, key);
  }
  assert.equal(startCondition({ detected: true, space: false, lifted: false }), false);
  assert.equal(startCondition({ detected: true, space: false, lifted: true }), true);
});

test('Manual single_cycle path retains its original behavior', () => {
  assert.equal(startCondition({ detected: false, system: false, single: true }), true);
  assert.equal(startCondition({ detected: false, single: true, robotClear: false }), false);
});

test('Other permit_cycle_after_unload paths remain independent of the filter', () => {
  const latchRequest = (waitEdge, runEdge, mode, detected, sensorEdge) =>
    waitEdge || runEdge || (mode && detected && sensorEdge);
  assert.equal(latchRequest(false, false, true, false, true), false);
  assert.equal(latchRequest(false, false, true, true, true), true);
  assert.equal(latchRequest(true, false, true, false, false), true);
  assert.equal(latchRequest(false, true, true, false, false), true);
});

// Sequence abstraction: main SFC consumes previous scan's permit;
// index finishes after 400 ms in this model, independently of sensor release.
function sequence(filtered, raw) {
  const t = new PresenceTON();
  let idle = true, priorPermit = false, ons = false, finishAt = null;
  const starts = [], departures = [];
  for (let now = 0; now <= 2400; now += 10) {
    if (!idle && now >= finishAt) idle = true;
    if (idle && priorPermit) { idle = false; finishAt = now + 400; starts.push(now); }
    const noSheet = raw(now);
    t.scan(now, noSheet);
    const condition = startCondition({ detected: filtered ? t.dn : !noSheet, idle });
    priorPermit = condition && !ons; ons = condition;
    if (noSheet) { assert.equal(t.dn, false); departures.push(now); }
  }
  return { starts, departures };
}

test('Original can start on a short pulse; modified cannot', () => {
  const raw = now => !(now >= 100 && now < 150);
  assert.equal(sequence(false, raw).starts.length, 1);
  assert.equal(sequence(true, raw).starts.length, 0);
});

test('Two real placements produce two starts with no restart in the empty interval', () => {
  const raw = now => !((now >= 100 && now < 400) || (now >= 1500 && now < 1800));
  assert.deepEqual(sequence(true, raw).starts, [310, 1710]);
});

test('Known limit: stuck presence can cause another cycle after returning idle', () => {
  // Shows explicitly why debounce is not robot-placement authentication.
  assert.ok(sequence(true, () => false).starts.length > 1);
});

console.table(results);
console.log(`${results.length} sampled-model checks passed. Field timing and I/O are not emulated.`);
