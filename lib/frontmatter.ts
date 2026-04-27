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
  const frontmatterRegex = /^---\n(.*?)\n---\n/;
  const frontmatterMatch = content.match(frontmatterRegex);
  if (frontmatterMatch) {
    return {
      frontmatter: JSON.parse(frontmatterMatch[1]!) as T,
      content: content.replace(frontmatterRegex, ""),
    };
  }
  return {
    frontmatter: {} as T,
    content: content,
  };
}

export function parseFrontMatterFromFile<T>(
  filePath: string,
): SplitFrontmatterResult<T> {
  const content = fs.readFileSync(filePath, "utf8");
  return splitFrontmatter<T>(content);
}
