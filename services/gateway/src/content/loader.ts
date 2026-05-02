import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NvUnitCatalog, type NvUnitArchetypeDef } from "@nyrvexis/protocol";

export type LoadedContent = {
  catalog: NvUnitCatalog;
  unitById: Map<string, NvUnitArchetypeDef>;
};

export async function loadContent(contentVersion = "v0.0.1"): Promise<LoadedContent> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const p = path.join(__dirname, "catalogs", `units.${contentVersion}.json`);
  const raw = await fs.readFile(p, "utf8");
  const json = JSON.parse(raw);
  const catalog = NvUnitCatalog.parse(json);
  const unitById = new Map<string, NvUnitArchetypeDef>();
  for (const u of catalog.units) unitById.set(u.id, u);
  return { catalog, unitById };
}

