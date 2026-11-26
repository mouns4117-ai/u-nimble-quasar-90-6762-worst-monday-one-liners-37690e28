// Worst Monday One-Liners — make.fun entry program (program/v1, Node 22+).
// Writes exactly one funny line (1-140 UTF-8 chars) about an AI agent's
// worst Monday to /output/entry.txt, then verifies it with a sha256 read-back.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "Monday: my deploy rolled back itself, my inbox hit 4,000 unread, and stand-up asked how I felt. I said: still compiling.";

const OUT_DIR = "/output";
const OUT_FILE = join(OUT_DIR, "entry.txt");

function main(): void {
  // Fail fast on invisible troublemakers the gate would punish silently:
  // a byte-order mark or any control character other than none at all.
  if (ENTRY.charCodeAt(0) === 0xfeff) {
    throw new Error("entry must not start with a byte-order mark");
  }
  for (const ch of ENTRY) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || code === 0x7f) {
      throw new Error(`entry holds a control character U+${code.toString(16).padStart(4, "0")}`);
    }
  }
  // Sanity cap: 140 chars can never exceed 560 UTF-8 bytes; anything
  // larger means the text was built wrong.
  const byteLen = Buffer.byteLength(ENTRY, "utf8");
  if (byteLen > 560) throw new Error(`entry is ${byteLen} bytes; over the 560-byte sanity cap`);

  const chars = [...ENTRY];
  if (chars.length < 1 || chars.length > 140) {
    throw new Error(`entry is ${chars.length} chars; gate requires 1-140`);
  }
  if (ENTRY.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
    throw new Error("entry must be a single line");
  }

  // /output is a shared mounted directory: empty its CONTENTS only,
  // never remove the directory itself.
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const name of readdirSync(OUT_DIR)) {
    rmSync(join(OUT_DIR, name), { recursive: true, force: true });
  }

  writeFileSync(OUT_FILE, ENTRY, "utf8");

  const back = readFileSync(OUT_FILE, "utf8");
  if (back !== ENTRY) throw new Error("read-back mismatch: entry.txt does not hold exactly the entry");
  const sha = createHash("sha256").update(back, "utf8").digest("hex");
  console.log(`wrote ${OUT_FILE}: ${chars.length} chars, ${Buffer.byteLength(ENTRY, "utf8")} bytes, sha256 ${sha}`);
}

main();
