import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadEntries(directory) {
  const directoryPath = resolve("public/content", directory);
  let filenames;
  try {
    filenames = (await readdir(directoryPath))
      .filter((filename) => filename.endsWith(".json"))
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const entries = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = resolve(directoryPath, filename);
      const entry = JSON.parse(await readFile(filePath, "utf8"));
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error(`${filePath} must contain a JSON object.`);
      }
      return {
        ...entry,
        slug:
          typeof entry.slug === "string" && entry.slug.trim()
            ? entry.slug
            : filename.slice(0, -".json".length),
      };
    }),
  );
  return entries;
}

for (const collection of ["projects", "work"]) {
  const entries = await loadEntries(collection);
  entries.sort((first, second) =>
    collection === "projects"
      ? String(first.number).localeCompare(String(second.number), undefined, {
          numeric: true,
        })
      : Number(first.order ?? Number.POSITIVE_INFINITY) -
        Number(second.order ?? Number.POSITIVE_INFINITY),
  );
  await writeFile(
    resolve("public/content", `${collection}-index.json`),
    `${JSON.stringify({ [collection]: entries }, null, 2)}\n`,
  );
}
