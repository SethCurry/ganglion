import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

// TODO add ability to search confluence

interface JiraCredentials {
  username: string;
  apiKey: string;
  url: string;
}

function getCredentials(): JiraCredentials {
  return {
    username: process.env.ATLASSIAN_USERNAME!,
    apiKey: process.env.ATLASSIAN_API_KEY!,
    url: process.env.JIRA_URL!,
  };
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: getBasicAuthHeader(getCredentials()),
  };
}

function getBasicAuthHeader(credentials: JiraCredentials): string {
  return `Basic ${Buffer.from(`${credentials.username}:${credentials.apiKey}`).toString("base64")}`;
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
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const jiraUrl = process.env.JIRA_URL;

      var createParams: any = {
        fields: {
          project: {
            key: "OCTO",
          },
          issuetype: {
            id: "10101",
          },
          summary: params.summary,
          description: {
            content: [
              {
                content: [
                  {
                    text: params.description,
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "doc",
            version: 1,
          },
          // story points
          customfield_10117: 1.0,
          // Why are we doing this
          customfield_11016: {
            content: [
              {
                content: [
                  {
                    text: "Reliability",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "doc",
            version: 1,
          },
          // Definition of done
          customfield_11277: {
            content: [
              {
                content: [
                  {
                    text: "Work contained in description is complete and tested",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "doc",
            version: 1,
          },
        },
      };

      if (params.epic !== undefined) {
        createParams.fields.parent = {
          key: params.epic,
        };
      }

      const response = await fetch(`${jiraUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(createParams),
      });

      ctx.ui.notify(JSON.stringify(response), "info");
      const data = await response.json();
      ctx.ui.notify(JSON.stringify(data), "info");

      return {
        content: [{ type: "text", text: `Jira Issue created: ${data.key}` }],
        details: {},
      };
    },
  });

  // Register a custom tool
  pi.registerTool({
    name: "tickets_in_current_sprint",
    label: "Tickets in Current Sprint",
    description: "Search for Jira issues in the current sprint",
    parameters: Type.Object({}),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const jiraUrl = process.env.JIRA_URL;
      const searchParams = {
        //jql: `parent = ${params.epic}`,
        jql: `assignee = currentUser() AND sprint in openSprints()`,
        fields: ["key", "summary", "description"],
      };

      const response = await fetch(`${jiraUrl}/rest/api/3/search/jql`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(searchParams),
      });
      const data = await response.json();
      const issueText =
        "Jira Issues:\n" +
        data.issues
          .map(
            (issue: any) =>
              `<issue>\n\t<key>${issue.key}</key>\n\t<summary>${issue.fields.summary}</summary>\n</issue>\n\n`,
          )
          .join("\n\n");
      return {
        content: [{ type: "text", text: issueText }],
        details: {},
      };
    },
  });
}
