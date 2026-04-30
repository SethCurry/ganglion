import fs from "fs";
import path from "path";

export async function* findFiles(
  directory: string,
  fileFilter?: (filePath: string) => boolean,
): AsyncGenerator<string> {
  for await (const d of await fs.promises.opendir(directory)) {
    const entry = path.join(directory, d.name);
    if (d.isDirectory()) yield* findFiles(entry, fileFilter);
    else if (d.isFile()) {
      if (fileFilter && !fileFilter(entry)) continue;
      yield entry;
    }
  }
}

export async function* mapFiles<T>(
  directory: string,
  mapper: (filePath: string) => Promise<T>,
  fileFilter?: (filePath: string) => boolean,
): AsyncGenerator<T> {
  for await (const filePath of findFiles(directory, fileFilter)) {
    yield await mapper(filePath);
  }
}
