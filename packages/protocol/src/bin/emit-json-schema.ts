import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { NvV1Schemas } from "../v1/registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// repoRoot/artifacts/json-schema
const outDir = path.resolve(__dirname, "../../../../artifacts/json-schema");

await fs.mkdir(outDir, { recursive: true });

for (const [name, schema] of Object.entries(NvV1Schemas)) {
  const jsonSchema = zodToJsonSchema(schema, { name, $refStrategy: "none" });
  const outPath = path.join(outDir, `nyrvexis.v1.${name}.schema.json`);
  await fs.writeFile(outPath, JSON.stringify(jsonSchema, null, 2) + "\n", "utf8");
}

// eslint-disable-next-line no-console
console.log(`Wrote JSON Schema files to ${outDir}`);

