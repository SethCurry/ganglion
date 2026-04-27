import path from "path";
import { env } from "process";
import fs from "fs";

interface Configuration {
    obsidian: {
        directory: string;
    }
    database: {
        database: string;
        host: string;
        user: string;
        port: number;
        password: string;
        max?: number;
    }
}

export function getConfiguration(): Configuration {
    const configPath = path.join(env.HOME!, ".pi", "ganglion.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as Configuration;
    return config;
}

export const config = getConfiguration();
