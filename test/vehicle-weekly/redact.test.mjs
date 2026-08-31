import test from "node:test";
import assert from "node:assert/strict";
import { redactPublicText } from "../../scripts/vehicle-weekly/redact.mjs";

test("redacts the configured vehicle name from public text", () => {
  const sampleName = "test vehicle";
  const previous = process.env.TESLAMATE_CAR_NAME;
  process.env.TESLAMATE_CAR_NAME = sampleName;
  try {
    const out = redactPublicText(`drive ${sampleName} token Bearer abc.def lat:35.12345`);
    assert.equal(out.includes(sampleName), false);
    assert.match(out, /차량/);
    assert.match(out, /Bearer \[redacted\]/);
    assert.match(out, /\[location\]/);
  } finally {
    if (previous === undefined) delete process.env.TESLAMATE_CAR_NAME;
    else process.env.TESLAMATE_CAR_NAME = previous;
  }
});

test("does not require a hardcoded real plate in source", async () => {
  const { readFile } = await import("node:fs/promises");
  const generate = await readFile(new URL("../../scripts/vehicle-weekly/generate.mjs", import.meta.url), "utf8");
  const redact = await readFile(new URL("../../scripts/vehicle-weekly/redact.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(generate, /DEFAULT_CAR_NAME/);
});
