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
  parser: (content: string) => any,
): SplitFrontmatterResult<T> {
  var inFrontmatter = false;
  var frontmatterContent = "";
  var systemPrompt = "";
  var isFirstLine = true;

  for (const line of content.split("\n")) {
    if (line.trim() === "---") {
      if (isFirstLine) {
        isFirstLine = false;
        inFrontmatter = !inFrontmatter;
      } else if (inFrontmatter) {
        inFrontmatter = false;
      }
      continue;
    }
    if (inFrontmatter) {
      frontmatterContent += line + "\n";
    } else {
      systemPrompt += line + "\n";
    }
  }

  var parsedFrontmatter: T = {} as T;

  if (frontmatterContent.trim() !== "") {
    try {
      parsedFrontmatter = parser(frontmatterContent) as T;
    } catch (error) {
      throw new Error(`Error parsing frontmatter: ${error}`);
    }
  }

  return {
    frontmatter: parsedFrontmatter as T,
    content: systemPrompt,
  };
}

export function parseFrontMatterFromFile<T>(
  filePath: string,
  parser: (content: string) => any,
): SplitFrontmatterResult<T> {
  const content = fs.readFileSync(filePath, "utf8");
  try {
    const parsed = splitFrontmatter<T>(content, parser);
    return parsed;
  } catch (error) {
    throw new Error(`Error parsing frontmatter in file ${filePath}: ${error}`);
  }
}
