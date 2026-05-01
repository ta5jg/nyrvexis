import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src/content/catalogs");
const dstDir = path.join(root, "dist/content/catalogs");

fs.mkdirSync(dstDir, { recursive: true });
for (const name of fs.readdirSync(srcDir)) {
  if (!name.endsWith(".json")) continue;
  fs.copyFileSync(path.join(srcDir, name), path.join(dstDir, name));
}
