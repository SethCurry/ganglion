import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const baseURL = "https://api.scryfall.com";

interface Card {
  id: string;
  oracle_id: string;
  multiverse_ids: number[];
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  colors: string[];
  color_identity: string[];
  keywords: string[];
}

function getCardByName(name: string): Promise<Card> {
  return fetch(`${baseURL}/cards/search?q=name:${name}`)
    .then((response) => response.json())
    .then((data) => {
      const card = data.data[0] as Card;
      return card;
    })
    .catch((error) => {
      throw new Error(`Failed to get card by name: ${error}`);
    });
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "scryfall_get_card_by_name",
    label: "Scryfall: Get Card by Name",
    description: "Get a Magic: The Gathering (MTG) card by name from Scryfall",
    parameters: Type.Object({
      name: Type.String(),
    }),
    execute: async function (
      id,
      params: { name: string },
      signal,
      onUpdate,
      _ctx,
    ) {
      const card = await getCardByName(params.name);
      return {
        content: [{ text: JSON.stringify(card), type: "text" }],
        details: [],
      };
    },
  });
}
