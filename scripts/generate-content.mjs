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
  entries.sort((first, second) => {
    if (collection === "projects") return first.slug.localeCompare(second.slug);
    const firstOrder = Number(first.order);
    const secondOrder = Number(second.order);
    if (Number.isFinite(firstOrder) && Number.isFinite(secondOrder)) {
      return firstOrder - secondOrder || first.slug.localeCompare(second.slug);
    }
    if (Number.isFinite(firstOrder)) return -1;
    if (Number.isFinite(secondOrder)) return 1;
    return first.slug.localeCompare(second.slug);
  });
  const normalizedEntries = entries.map((entry, index) => {
    if (collection === "projects") {
      const images = Array.isArray(entry.images)
        ? entry.images.filter((image) => typeof image === "string" && image)
        : [];
      return { ...entry, number: String(index + 1).padStart(2, "0"), images };
    }
    const media = Array.isArray(entry.media)
      ? entry.media.filter((file) => typeof file === "string" && file)
      : [];
    return { ...entry, media };
  });
  await writeFile(
    resolve("public/content", `${collection}-index.json`),
    `${JSON.stringify({ [collection]: normalizedEntries }, null, 2)}\n`,
  );
}
