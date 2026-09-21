import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(path.resolve('public/sfc-embed.js'), 'utf8');
const sandbox = {
  window: {},
  document: {readyState: 'loading', addEventListener() {}},
};
vm.runInNewContext(source, sandbox);

test('each SFC SVG keeps its own Step clip and arrow marker', () => {
  const svg = '<svg><defs><marker id="sfc-arrow"></marker><clipPath id="sfc-clip-10"><rect y="400"></rect></clipPath></defs>' +
    '<text clip-path="url(#sfc-clip-10)">State_raise_finger_001</text>' +
    '<path marker-end="url(#sfc-arrow)"></path></svg>';
  const first = sandbox.window.L5XScopeSfcSvgIds(svg, 'note-0');
  const second = sandbox.window.L5XScopeSfcSvgIds(svg, 'note-2');
  assert.match(first, /id="sfc-clip-10-note-0"/);
  assert.match(first, /clip-path="url\(#sfc-clip-10-note-0\)"/);
  assert.match(first, /marker-end="url\(#sfc-arrow-note-0\)"/);
  assert.match(second, /id="sfc-clip-10-note-2"/);
  assert.match(second, /clip-path="url\(#sfc-clip-10-note-2\)"/);
  assert.doesNotMatch(second, /url\(#sfc-clip-10-note-0\)/);
});
