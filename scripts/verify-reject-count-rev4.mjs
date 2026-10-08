// Run from the site root: node scripts/verify-reject-count-rev4.mjs
// Documentation-only fixed-scan model. No PLC or robot connection.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const slug = 'csm-reject-count-error-analysis';
const note = fs.readFileSync(`src/content/notes/${slug}.md`, 'utf8');
assert.ok(!/l5x|\/Users\/|보안상|교육용|기록용/i.test(note), 'Excluded wording in note');
assert.ok(note.includes('Rev.4'));
const response = await fetch('https://alzza.github.io/l5x-ld-studio/app.js?v=20260920');
assert.ok(response.ok);
const source = await response.text();
const ctx = { window: {}, document: { querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} }, localStorage: { getItem: () => null }, console };
vm.createContext(ctx);
vm.runInContext(source, ctx, { timeout: 5000 });
const ladder = ctx.window.L5XLadder;
const parsed = {};
const figs = [...note.matchAll(/<figure class="ld-rung" data-rung="([^"]+)" data-rll="([^"]+)">([\s\S]*?)<\/figure>/g)];
assert.equal(figs.length, 5);
const figures = [];
for (const match of figs) {
  const [, number, rll, body] = match;
  const file = body.match(/<img src="([^"]+)"/)[1];
  assert.ok([4, 6].some(rev => file.startsWith(`/images/notes/${slug}/rev${rev}/`)));
  assert.ok(body.includes('rung-meta-description'));
  const prior = note.slice(0, match.index);
  const lastCode = [...prior.matchAll(/```text\n([\s\S]*?)\n```/g)].at(-1)?.[1];
  assert.equal(lastCode, rll, 'Visible RLL must equal figure data-rll');
  const parser = new ladder.RLLParser(rll);
  const ast = parser.parse();
  assert.equal(parser.warnings.length, 0);
  const rr = ladder.renderRung({ number, text: rll }, 0, 1040, false);
  assert.equal(rr.warnings.length, 0);
  assert.ok(!rr.svg.includes('class="rung-index"'));
  const output = `public${file}`;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, rr.svg);
  const key = path.basename(file, '.svg');
  parsed[key] = ast;
  figures.push({ key: file, rll, parser_warnings: 0, width: rr.width });
}
const before = figures.find(f => f.key.endsWith('/before1.svg')).rll;
const after = figures.find(f => f.key.endsWith('/after1.svg')).rll;
assert.equal(after, before.replace('XIC(z_signal_reject_loaded)', 'XIC(i_r2_reject_loaded)'));

// Execute the exact three counter ASTs, not handwritten counter expressions.
function execute(node, state, power = true) {
  if (node.type === 'sequence') {
    for (const child of node.children) power = execute(child, state, power);
    return power;
  }
  if (node.type === 'parallel') {
    // Evaluate every output branch; do not short-circuit side effects.
    const branches = node.branches.map(branch => execute(branch, state, power));
    return branches.some(Boolean);
  }
  assert.equal(node.type, 'instruction');
  const [a, b, c] = node.args;
  if (node.op === 'XIC') return power && !!state[a];
  if (node.op === 'OTL') {
    if (power) state[a] = true;
    return power;
  }
  if (node.op === 'ONS') {
    const pulse = power && !state[a];
    state[a] = power;
    return pulse;
  }
  if (node.op === 'ADD') {
    if (power) state[c] = state[a] + Number(b);
    return power;
  }
  throw Error(`Unmodelled instruction: ${node.op}`);
}

function run(rows, changed) {
  const state = { reject_increment: 0, z_R2_Reject_Count: 0, reject_incr_ons: true, ons_reject_done: true, z_signal_reject_loaded: false };
  state.z_i_reject = state.z_i_reject_rb2 = false;
  let dn = false, acc = 15000;
  const events = [], trace = [];
  rows.forEach((row, index) => {
    const { panel = false, hmi = false, clear = true, done = false, full = false, home = false } = row;
    // Operator_Console -> Prod_Tracking -> Robot2, inputs frozen for this scan.
    state.i_reject = panel;
    state.ui_i_R2_reject = hmi;
    execute(parsed.panel21, state);
    const requestAtCommand = state.z_i_reject_rb2;
    const signalAtProduction = state.z_signal_reject_loaded;
    state.i_reject_loaded = state.i_r2_reject_loaded = done;
    if (row.reset) state.reject_increment = 0;
    if (row.corruptProductionOns) state.reject_incr_ons = false;
    const previous = state.reject_increment;
    execute(parsed[changed ? 'after1' : 'before1'], state);
    if (state.reject_increment > previous) events.push(index * 50);
    // Reduced panel-request command path only; not the full Robot2 routine.
    const command = requestAtCommand && clear && !full;
    if (command) { dn = true; acc = 0; }
    else if (dn) { acc += 50; if (acc >= 15000) dn = false; }
    state.z_signal_reject_loaded = dn;
    execute(parsed.rack47, state);
    if (done || home) state.z_i_reject = state.z_i_reject_rb2 = false;
    trace.push({ ms: index * 50, panel, hmi, clear, full, production: state.reject_increment, rack: state.z_R2_Reject_Count, requestAtCommand, request: state.z_i_reject_rb2, command, done, signalAtProduction, signalAfterRobot2: dn, timerAcc: acc });
  });
  return { production: state.reject_increment, rack: state.z_R2_Reject_Count, event_ms: events, trace };
}
function single(gap = 16000, order = 'same', held = false) {
  const end = 1000 + gap;
  const completion = end + (order === 'done_first' ? -50 : order === 'clear_first' ? 50 : 0);
  return Array.from({ length: (end + 2500) / 50 }, (_, i) => {
    const t = i * 50;
    return { panel: t >= 200 && t < (held ? end + 1500 : 400), clear: t < 1000 || t >= end, done: t >= completion && t < completion + 1000 };
  });
}
const pause = n => Array.from({ length: n }, () => ({}));
const pulse = n => Array.from({ length: n }, () => ({ done: true }));
const cases = [];
function check(name, rows, expected, originalExpected = null) {
  const original = run(rows, false), changed = run(rows, true);
  assert.equal(changed.production, expected, name);
  assert.equal(changed.rack, expected, `${name}: rack`);
  if (originalExpected !== null) assert.equal(original.production, originalExpected, `${name}: original`);
  cases.push({ name, original: original.production, changed: changed.production, rack: changed.rack, changed_event_ms: changed.event_ms });
  return changed;
}
check('full0_off10_same', single(10000), 1, 1);
check('full0_off16_same', single(), 1, 2);
check('full0_off16_done_first', single(16000, 'done_first'), 1, 1);
check('full0_off16_clear_first', single(16000, 'clear_first'), 1, 2);
check('held_button_one_completion', single(16000, 'same', true), 1);
const repeated = single();
for (let i = 30; i < 250; i += 10) repeated[i].panel = true;
check('repeated_button_one_completion', repeated, 1);
const fullWait = single();
fullWait.forEach((r, i) => { if (i * 50 < 900) r.full = true; });
check('full_wait_then_release', fullWait, 1);
const fullDuring = single(35000);
fullDuring.forEach((r, i) => { if (i * 50 >= 1500 && i * 50 < 25000) r.full = true; });
check('full_during_work_then_resume', fullDuring, 1);
check('completion_held_three_seconds', [...pause(4), ...pulse(60), ...pause(4)], 1);
// Keep timer state across jobs: the old signal can merge the second job.
const sequential = check('two_sequential_completion_inputs', [...single(), ...single(10000)], 2, 2);
assert.equal(sequential.trace[single().length - 1].production, 1);
check('two_completions_within_15_seconds', [{}, { panel: true }, ...pulse(20), ...pause(5), { panel: true }, ...pulse(20), ...pause(5)], 2, 1);
check('cancel_without_completion', [{}, { panel: true }, { home: true }, ...pause(400)], 0);
check('normal_outfeed_open_not_reject', [{}, { gripperOpen: true }, ...pause(25)], 0);
check('prescan_input_already_high', pulse(20), 0);
check('prescan_then_new_completion', [...pulse(20), ...pause(2), ...pulse(20)], 1);

let sweep = 0;
for (const gap of [500, 10000, 14900, 15100, 16000, 30000]) {
  for (const order of ['same', 'done_first', 'clear_first']) {
    for (const held of [false, true]) {
      const result = run(single(gap, order, held), true);
      assert.equal(result.production, 1); assert.equal(result.rack, 1); sweep++;
    }
  }
}
const resetResult = run([...pause(2), ...pulse(20), { done: true, reset: true }, ...pulse(5), ...pause(2), ...pulse(20)], true);
assert.equal(resetResult.production, 1); assert.equal(resetResult.rack, 2);
const duplicate = run([...pause(2), ...pulse(20), ...pause(2), ...pulse(20)], true);
assert.equal(duplicate.production, 2); assert.equal(duplicate.rack, 2);
const corrupt = run([...pause(2), ...pulse(3), { done: true, corruptProductionOns: true }, ...pulse(4)], true);
assert.equal(corrupt.production, 2); assert.equal(corrupt.rack, 1);

const out = `public/downloads/${slug}/rev4`;
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(`${out}/Prod_Tracking_Background_Rung1_before.txt`, before + '\n');
fs.writeFileSync(`${out}/Prod_Tracking_Background_Rung1_after.txt`, after + '\n');
const verification = {
  revision: 4, date: '2026-10-07',
  scope: 'Exact counter RLL ASTs; reduced panel-command/TOF model; 50ms frozen-input scans. No full SFC, robot motion, real queue, asynchronous IO or field validation.',
  studio_verify: false, field_validated: false,
  renderer_sha256: crypto.createHash('sha256').update(source).digest('hex'),
  figures: figures.filter(f => f.key.includes('/rev4/')), scenarios: cases, sweep_cases: sweep,
  reset_check: { production: resetResult.production, rack: resetResult.rack, expected: 'Production reset does not reset rack or retrigger held completion.' },
  negative_controls: [
    { name: 'Two completion pulses for one physical job', production: duplicate.production, rack: duplicate.rack, limitation: 'Input deduplication is not implemented.' },
    { name: 'External clear of production ONS during high input', production: corrupt.production, rack: corrupt.rack, limitation: 'Other writers must be ruled out; rack +1 alone does not exclude this cause.' },
  ],
};
fs.writeFileSync(`${out}/verification.json`, JSON.stringify(verification, null, 2) + '\n');
console.log(JSON.stringify({ figures: figures.length, parser_warnings: 0, cases: cases.length, sweep, reset_checks: 1, negative_controls: 2, results: cases }, null, 2));

// Rev.6: sampled button/HMI input, not a physical contact-bounce waveform.
const chatterCases = [];
function chatter(name, rows, expectedOriginal, expectedPending = false) {
  const original = run(rows, false), changed = run(rows, true);
  assert.equal(original.production, expectedOriginal, name);
  assert.equal(original.rack, 1, name);
  assert.equal(changed.production, 1, name);
  assert.equal(changed.rack, 1, name);
  assert.equal(original.trace.at(-1).request, expectedPending, name);
  // Changing only the counter must not change command/request/timer behavior.
  const controls = trace => trace.map(({ production, ...rest }) => rest);
  assert.deepEqual(controls(original.trace), controls(changed.trace), name);
  chatterCases.push({ name, original: original.production, changed: changed.production, rack: original.rack, pending_at_end: expectedPending, original_event_ms: original.event_ms, changed_event_ms: changed.event_ms, trace: original.trace });
}
chatter('clean_done_first_16s', single(16000, 'done_first'), 1);
const initialBounce = single(10000, 'done_first');
initialBounce.forEach((r, i) => { r.panel = [200, 300, 400].includes(i * 50); });
chatter('initial_press_bounce_10s', initialBounce, 1);
const rawOffLong = Array.from({ length: 480 }, (_, i) => ({ panel: i === 4 || i === 405, clear: true, done: i >= 440 && i < 460 }));
chatter('raw_off_over_20s_command_stays_on', rawOffLong, 1);
function residual(gap, input = 'panel') {
  const rows = single(gap, 'done_first');
  rows[(1000 + gap) / 50][input] = true;
  return rows;
}
chatter('relatch_during_completion_16s', residual(16000), 2);
chatter('relatch_during_completion_10s', residual(10000), 1);
const lateBounce = single(16000, 'done_first');
lateBounce[18500 / 50].panel = true;
chatter('late_input_after_completion_pulse', lateBounce, 2, true);
chatter('hmi_relatch_during_completion_16s', residual(16000, 'hmi'), 2);
const fullAtRelatch = residual(16000);
fullAtRelatch.forEach((r, i) => { if (i * 50 >= 17000 && i * 50 < 18000) r.full = true; });
chatter('full_blocks_residual_request_then_done_clears', fullAtRelatch, 1);
chatter('no_chatter_same_scan_completion_clear_16s', single(16000), 2);
const chatterOut = `public/downloads/${slug}/rev6`;
fs.mkdirSync(chatterOut, { recursive: true });
fs.writeFileSync(`${chatterOut}/chatter-verification.json`, JSON.stringify({
  revision: 6, date: '2026-10-08', scan_ms: 50,
  scope: 'Exact panel OTL and counter ASTs; reduced panel-command/TOF/completion-clear path. Inputs frozen per scan. Not contact physics, full robot/SFC execution, asynchronous IO, or field validation.',
  field_validated: false, physical_chatter_confirmed: false,
  timer_pre_ms: 15000, task_order: ['Operator_Console', 'Prod_Tracking', 'Robot2'],
  panel_rll: figures.find(f => f.key.endsWith('/panel21.svg')).rll,
  original_counter_rll: before, changed_counter_rll: after,
  figures: figures.filter(f => f.key.includes('/rev6/')),
  scenarios: chatterCases,
}, null, 2) + '\n');
console.log(JSON.stringify({ chatter_cases: chatterCases.length, results: chatterCases.map(({ trace, ...rest }) => rest) }, null, 2));
