import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KrUnitCatalog, type KrUnitArchetypeDef } from "@kindrail/protocol";

export type LoadedContent = {
  catalog: KrUnitCatalog;
  unitById: Map<string, KrUnitArchetypeDef>;
};

export async function loadContent(): Promise<LoadedContent> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const p = path.join(__dirname, "units.catalog.json");
  const raw = await fs.readFile(p, "utf8");
  const json = JSON.parse(raw);
  const catalog = KrUnitCatalog.parse(json);
  const unitById = new Map<string, KrUnitArchetypeDef>();
  for (const u of catalog.units) unitById.set(u.id, u);
  return { catalog, unitById };
}

