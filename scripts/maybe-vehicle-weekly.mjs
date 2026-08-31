import { spawnSync } from "node:child_process";
import { generateWeeklyReport } from "./vehicle-weekly/generate.mjs";
import { redactPublicText } from "./vehicle-weekly/redact.mjs";

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    const err = new Error("git command failed");
    err.code = "GIT_FAILED";
    throw err;
  }
  return result;
}

if (!isTruthy(process.env.WEEKLY_VEHICLE_REPORT)) {
  process.exit(0);
}

const result = await generateWeeklyReport({
  force: isTruthy(process.env.FORCE_OVERWRITE),
});

if (result.wrote && process.env.GITHUB_ACTIONS === "true") {
  git(["config", "user.name", "github-actions[bot]"]);
  git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  git(["add", "--", result.file]);
  const diff = spawnSync("git", ["diff", "--cached", "--quiet"]);
  if (diff.status !== 0) {
    git(["commit", "-m", "chore: add weekly vehicle health report"]);
    git(["push"]);
  }
}

console.log(redactPublicText(`weekly report ${result.skipped ? "skipped" : result.report?.riskLevel}`));
