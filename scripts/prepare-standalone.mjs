import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next/standalone");
const standaloneNext = resolve(standalone, ".next");

if (!existsSync(resolve(standalone, "server.js"))) {
  throw new Error("Next.js standalone server was not generated. Run `next build` first.");
}

mkdirSync(standaloneNext, { recursive: true });
for (const [source, destination] of [
  [resolve(root, ".next/static"), resolve(standaloneNext, "static")],
  [resolve(root, "public"), resolve(standalone, "public")],
]) {
  if (existsSync(source)) cpSync(source, destination, { recursive: true, force: true });
}

console.log("Standalone runtime prepared with static assets and public files.");
