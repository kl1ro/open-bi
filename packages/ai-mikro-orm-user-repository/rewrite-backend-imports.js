import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDirectory = path.join(import.meta.dirname, "dist");
const distEntries = await readdir(distDirectory);

for (const entry of distEntries) await rewriteBackendImport(entry);

async function rewriteBackendImport(entry) {
  if (!entry.endsWith(".js") && !entry.endsWith(".d.ts")) return;

  const filePath = path.join(distDirectory, entry);
  const source = await readFile(filePath, "utf8");
  const runtimeRoot = entry.endsWith(".d.ts") ? "../../../../src/" : "../../../../dist/src/";
  const rewritten = source.replaceAll("mip-bi-back/", runtimeRoot);
  if (rewritten === source) return;

  await writeFile(filePath, rewritten);
}
