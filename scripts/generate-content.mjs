import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadEntries(directory) {
  const directoryPath = resolve("public/content", directory);
  const filenames = (await readdir(directoryPath))
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const entries = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = resolve(directoryPath, filename);
      const entry = JSON.parse(await readFile(filePath, "utf8"));
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error(`${filePath} must contain a JSON object.`);
      }
      return entry;
    }),
  );
  return entries;
}

for (const collection of ["projects", "work"]) {
  const entries = await loadEntries(collection);
  if (entries.length === 0) {
    throw new Error(`The ${collection} collection must contain at least one entry.`);
  }
  entries.sort((first, second) =>
    collection === "projects"
      ? String(first.number).localeCompare(String(second.number), undefined, {
          numeric: true,
        })
      : Number(first.order) - Number(second.order),
  );
  await writeFile(
    resolve("public/content", `${collection}-index.json`),
    `${JSON.stringify({ [collection]: entries }, null, 2)}\n`,
  );
}
