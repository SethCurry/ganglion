import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import fs from "fs";
import {
  parseFrontMatterFromFile,
  type SplitFrontmatterResult,
} from "../lib/frontmatter.ts";

function getProfileDirectory() {
  return fs.realpathSync(process.env.HOME + "/.pi/profiles");
}

async function listProfiles() {
  const profileDir = getProfileDirectory();
  const profiles = fs.readdirSync(profileDir);
  return profiles
    .filter((profile) => profile.endsWith(".md"))
    .map((profile) => {
      return {
        name: profile.replace(".md", ""),
        path: profileDir + "/" + profile,
      };
    });
}

interface Profile {
  model?: string;
  tools?: string[];
}

interface ModelsConfig {
  providers: {
    [provider: string]: {
      baseUrl: string;
      apiKey: string;
      api: string;
      models: {
        id: string;
      }[];
    };
  };
}

function loadModelsConfig() {
  const modelsConfigFile = fs.realpathSync(__dirname + "/../../../models.json");
  const modelsConfig = fs.readFileSync(modelsConfigFile, "utf8");
  return JSON.parse(modelsConfig) as ModelsConfig;
}

function getModelProvider(modelId: string) {
  const modelsConfig = loadModelsConfig();

  for (const provider of Object.values(modelsConfig.providers)) {
    for (const model of provider.models) {
      if (model.id === modelId) {
        return provider;
      }
    }
  }
  return null;
}

function getProfile(name: string) {
  const profileDir = getProfileDirectory();
  const profileFile = profileDir + "/" + name + ".md";
  const profile = parseFrontMatterFromFile<Profile>(profileFile);
  return profile;
}

export default function (pi: ExtensionAPI) {
  var activeProfile: SplitFrontmatterResult<Profile> | null = null;

  pi.registerCommand("list_profiles", {
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const profiles = await listProfiles();
      var message = "Available profiles:\n";
      profiles.forEach((profile) => {
        message += `- ${profile.name}\n`;
      });
      ctx.ui.notify(message, "info");
    },
  });

  pi.on("before_agent_start", async (ctx) => {
    if (activeProfile) {
      return { systemPrompt: activeProfile.content };
    }
  });

  pi.registerCommand("active-tools", {
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const tools = pi.getActiveTools();
      var message = "Active tools:\n";
      tools.forEach((tool) => {
        message += `- ${tool}\n`;
      });
      ctx.ui.notify(message, "info");
    },
  });

  pi.registerCommand("all-tools", {
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const tools = pi.getAllTools();
      var message = "Available tools:\n";
      tools.forEach((tool) => {
        message += `- ${tool.name}\n`;
      });
      ctx.ui.notify(message, "info");
    },
  });

  pi.registerCommand("profile", {
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      var profileName = args;
      if (args === "") {
        const profiles = await listProfiles();

        const profileNames = profiles.map((profile) => profile.name);

        const selectedProfileName = await ctx.ui.select(
          "Select a profile",
          profileNames,
        );
        if (selectedProfileName) {
          profileName = selectedProfileName;
        } else {
          return;
        }
      }
      const parsedProfile = getProfile(profileName);
      activeProfile = parsedProfile;
      const profile = parsedProfile.frontmatter;

      const messages: string[] = [];

      if (parsedProfile.content && parsedProfile.content.trim() !== "") {
        await ctx.newSession({
          parentSession: ctx.sessionManager.getSessionId(),
        });
      }

      if (profile.model) {
        const allModels = ctx.modelRegistry.getAll();

        const model = allModels.find((model) => model.id === profile.model);
        if (!model) {
          ctx.ui.notify(`Model ${profile.model} not found`, "error");
          return;
        }

        pi.setModel(model);
        messages.push(`Switched to model: ${profile.model}`);
      }

      if (profile.tools) {
        pi.setActiveTools(profile.tools);
        messages.push(`Set active tools: ${profile.tools.join(", ")}`);
      }

      ctx.ui.notify(messages.join("\n"), "info");
    },
  });
}
