import fs from "fs";

interface Frontmatter {
  [key: string]: any;
}

export interface SplitFrontmatterResult<T> {
  frontmatter: T;
  content: string;
}

export function splitFrontmatter<T>(
  content: string,
): SplitFrontmatterResult<T> {
  var inFrontmatter = false;
  var frontmatterContent = "";
  var systemPrompt = "";

  for (const line of content.split("\n")) {
    if (line.trim() === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter) {
      frontmatterContent += line + "\n";
    } else {
      systemPrompt += line + "\n";
    }
  }
  return {
    frontmatter: JSON.parse(frontmatterContent) as T,
    content: systemPrompt,
  };
}

export function parseFrontMatterFromFile<T>(
  filePath: string,
): SplitFrontmatterResult<T> {
  const content = fs.readFileSync(filePath, "utf8");
  return splitFrontmatter<T>(content);
}
