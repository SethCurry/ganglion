import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import fs from "fs";
import { execSync } from "child_process";
import { config } from "../lib/configuration.ts";


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
          content: [{ type: "text", text: "No journal entry found for today." }],
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
      try {
        const cmdResult = execSync(`rg -i "\\\\- \\\\[ \\\\]\\\\s*"`, {
          cwd: notesDir,
        });
        todoOutput = cmdResult.toString();
      } catch (error) {
        console.error(error);
        return {
          content: [{ type: "text", text: "Error getting todo items." }],
          details: {},
        };
      }

      const todoItems: string[] = [];

      const todoLines = todoOutput
        .split("\n")
        .filter((line) => line.trim() !== "");

      todoLines.forEach((line) => {
        const todoItem = JSON.parse(line) as {
          type: string;
          data: {
            path: {
              text: string;
            };
            lines: {
              text: string;
            };
          };
        };

        if (todoItem.type === "match") {
          todoItems.push(todoItem.data.lines.text.replace("- [ ] ", ""));
        }
      });

      return {
        content: [{ type: "text", text: "Todo Items:\n\n" + todoItems }],
        details: {},
      };
    },
  });
}
