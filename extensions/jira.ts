import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { JiraClient } from "../lib/jira.ts";

function getClient(): JiraClient {
  return new JiraClient(process.env.JIRA_URL!, {
    username: process.env.ATLASSIAN_USERNAME!,
    apiKey: process.env.ATLASSIAN_API_KEY!,
  });
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "create_jira_issue",
    label: "Create Jira Issue",
    description: "Create a new Jira issue",
    parameters: Type.Object({
      summary: Type.String({ description: "The summary of the issue" }),
      description: Type.String({ description: "The description of the issue" }),
      epic: Type.Optional(
        Type.String({
          description: "The Jira key of the Epic to include the issue in.",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const client = getClient();
      const result = await client.createIssue(params);
      return {
        content: [{ type: "text", text: `Jira Issue created: ${result.key}` }],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: "jira_issues_in_epic",
    label: "Jira Issues in Epic",
    description: "Search for Jira issues in a particular Epic.",
    parameters: Type.Object({
      epic: Type.String({
        description: "The Jira key of the Epic to search for issues in.",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const client = getClient();
      const issues = await client.issuesInEpic(params.epic);

      const issueText =
        "Jira Issues:\n" +
        issues
          .map(
            (issue) =>
              `<issue>\n\t<key>${issue.key}</key>\n\t<summary>${issue.summary}</summary>\n</issue>\n\n`,
          )
          .join("\n\n");

      return {
        content: [{ type: "text", text: issueText }],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: "tickets_in_current_sprint",
    label: "Tickets in Current Sprint",
    description: "Search for Jira issues in the current sprint",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      const client = getClient();
      const issues = await client.ticketsInCurrentSprint();

      const issueText =
        "Jira Issues:\n" +
        issues
          .map(
            (issue) =>
              `<issue>\n\t<key>${issue.key}</key>\n\t<summary>${issue.summary}</summary>\n</issue>\n\n`,
          )
          .join("\n\n");

      return {
        content: [{ type: "text", text: issueText }],
        details: {},
      };
    },
  });
}
