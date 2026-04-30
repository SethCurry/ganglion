import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import fs from "fs";
import { execSync } from "child_process";
import { config } from "../lib/configuration.ts";
import { parseFrontMatterFromFile } from "../lib/frontmatter.ts";
import { findFiles } from "../lib/sfiles.ts";
import yaml from "yaml";

interface TodoFile {
  filePath: string;
  tasks: string[];
}

export default function (pi: ExtensionAPI) {
  const notesDir = config.obsidian.directory;
  pi.registerTool({
    name: "get_todays_journal",
    label: "Get Today's Journal",
    description:
      "Get the journal entry for the current day, containing notes, todo items, and other thoughts.",
    parameters: Type.Object({}),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const today = new Date().toISOString().split("T")[0];

      const dateParts = today!.split("-");
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];

      const journalFile = `${notesDir}/Journal/${year}/${month}/${year}-${month}-${day}.md`;
      const exists = fs.existsSync(journalFile);
      if (!exists) {
        return {
          content: [
            { type: "text", text: "No journal entry found for today." },
          ],
          details: {},
        };
      }
      const journalContent = fs.readFileSync(journalFile, "utf8");

      return {
        content: [
          { type: "text", text: `Today's Journal:\n${journalContent}` },
        ],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: "get_todo_items",
    label: "Get Todo Items",
    description: "Get all open todo items from notes",
    parameters: Type.Object({}),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      let todoOutput: string;

      const todoItems: TodoFile[] = [];

      for await (const filePath of findFiles(notesDir, (filePath) =>
        filePath.endsWith(".md"),
      )) {
        const tasks: string[] = [];
        const fileFrontmatter = parseFrontMatterFromFile(filePath, yaml.parse);
        const fileContent = fileFrontmatter.content;

        for (const line of fileContent.split("\n")) {
          if (line.trim() === "") continue;
          if (line.trim().startsWith("- [ ] ")) {
            tasks.push(line.trim().replace("- [ ] ", ""));
          }
        }

        if (tasks.length > 0) {
          todoItems.push({
            filePath,
            tasks,
          });
        }
      }

      const todoItemsText = todoItems
        .map((todoItem) => {
          var text = `### ${todoItem.filePath}\n`;
          for (const task of todoItem.tasks) {
            text += `- ${task}\n`;
          }
          return text;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: "Found Todo Items:\n\n" + todoItemsText,
          },
        ],
        details: {},
      };
    },
  });
}
