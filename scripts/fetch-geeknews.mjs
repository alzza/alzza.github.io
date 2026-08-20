import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const FEED = "https://news.hada.io/rss/news";
const LIMIT = 20;
const outFile = fileURLToPath(new URL("../src/data/geeknews.json", import.meta.url));

function pick(block, re) {
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function strip(html) {
  return html
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function existing() {
  try {
    return JSON.parse(await readFile(outFile, "utf8"));
  } catch {
    return null;
  }
}

let xml;
try {
  const res = await fetch(FEED, {
    headers: { "user-agent": "alzza.github.io geeknews-fetch" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  xml = await res.text();
} catch (err) {
  const prev = await existing();
  if (prev?.items?.length) {
    console.warn("geeknews fetch failed, keeping previous list:", err.message);
    process.exit(0);
  }
  throw err;
}

if (!xml.includes("<entry>")) {
  const prev = await existing();
  if (prev?.items?.length) {
    console.warn("geeknews feed empty, keeping previous list");
    process.exit(0);
  }
  throw new Error("geeknews feed has no entries");
}

const items = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, LIMIT).map((m, i) => {
  const b = m[1];
  const title = strip(pick(b, /<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/));
  const href =
    pick(b, /<link[^>]*href='([^']+)'/) || pick(b, /<link[^>]*href="([^"]+)"/);
  const published = pick(b, /<published>([^<]+)<\/published>/);
  const author = pick(b, /<name>([^<]+)<\/name>/);
  const raw = pick(b, /<content[^>]*>([\s\S]*?)<\/content>/);
  return {
    rank: i + 1,
    title: title || "(제목 없음)",
    href,
    published,
    author,
    excerpt: strip(raw).slice(0, 120),
  };
});

if (!items.length) {
  const prev = await existing();
  if (prev?.items?.length) {
    console.warn("geeknews parse empty, keeping previous list");
    process.exit(0);
  }
  throw new Error("geeknews parse produced no items");
}

const payload = {
  fetchedAt: new Date().toISOString(),
  source: FEED,
  items,
};

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(payload, null, 2) + "\n");
console.log(`wrote ${items.length} items to src/data/geeknews.json`);
