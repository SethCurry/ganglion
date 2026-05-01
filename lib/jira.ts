export interface JiraCredentials {
  username: string;
  apiKey: string;
}

export interface CreateIssueParams {
  summary: string;
  description: string;
  epic?: string;
}

export interface CreateIssueResult {
  key: string;
}

export interface IssueSummary {
  key: string;
  summary: string;
  description?: string;
}

export class JiraClient {
  private readonly url: string;
  private readonly credentials: JiraCredentials;

  constructor(url: string, credentials: JiraCredentials) {
    this.url = url;
    this.credentials = credentials;
  }

  private buildUrl(path: string): string {
    return `${this.url}${path}`;
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(
      `${this.credentials.username}:${this.credentials.apiKey}`,
    ).toString("base64")}`;
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: this.authHeader,
    };
  }

  async createIssue(params: CreateIssueParams): Promise<CreateIssueResult> {
    const body: Record<string, unknown> = {
      fields: {
        project: { key: "OCTO" },
        issuetype: { id: "10101" },
        summary: params.summary,
        description: {
          content: [
            {
              content: [{ text: params.description, type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
          version: 1,
        },
        customfield_10117: 1.0, // story points
        customfield_11016: {
          content: [
            {
              content: [{ text: "Reliability", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
          version: 1,
        },
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
      (body.fields as Record<string, unknown>).parent = { key: params.epic };
    }

    const response = await fetch(this.buildUrl("/rest/api/3/issue"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { key: string };
    return { key: data.key };
  }

  async issuesInEpic(epic: string): Promise<IssueSummary[]> {
    const body = {
      jql: `parent = ${epic}`,
      fields: ["key", "summary"],
    };

    const response = await fetch(this.buildUrl("/rest/api/3/search/jql"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      issues: Array<{ key: string; fields: { summary: string } }>;
    };

    return data.issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
    }));
  }

  async ticketsInCurrentSprint(): Promise<IssueSummary[]> {
    const body = {
      jql: `assignee = currentUser() AND sprint in openSprints()`,
      fields: ["key", "summary", "description"],
    };

    const response = await fetch(this.buildUrl("/rest/api/3/search/jql"), {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      issues: Array<{
        key: string;
        fields: { summary: string; description: string };
      }>;
    };

    return data.issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
    }));
  }
}
