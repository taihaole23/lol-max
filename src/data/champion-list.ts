// Every League champion (from Data Dragon), for the search bar. Made by scripts/update-icons.mjs.
// Never edit the .json by hand: run the script again. When the patch changes, update the file name.
//
// This is NOT the list of champions the site can calculate: that's playable-champions.ts.
// The search bar shows every champion here and marks the others "coming soon".
import snapshot from "./champion-list.26.23.json";

export type ChampionListEntry = {
  slug: string; // used in web addresses and icon file names: "katarina", "kaisa", "nunuwillump"
  name: string; // "Kai'Sa"
  ddragonId: string; // Data Dragon's own id: "Kaisa", "MonkeyKing" (Wukong)
  // Q, W, E, R: names and number of ranks, for the ability bar. Display only: Data Dragon's
  // ability NUMBERS are unreliable, so a champion the site calculates gets its own data file.
  abilities: { key: "q" | "w" | "e" | "r"; name: string; maxRank: number }[];
  // The skin whose splash art is behind the page (one of the best: see update-icons.mjs).
  splash: { skin: string; num: number } | null;
  // The champion page's accent colour, picked from the splash art (scripts/splash-colors.mjs).
  // null when the splash is nearly black and white: the page keeps the site's normal red.
  splashColor: string | null;
};

export const championListSource = { url: snapshot.source, patch: snapshot.patch };
// Where the skin tiers come from (to pick each champion's splash art).
export const skinTierSource = { url: snapshot.skinTierSource, patch: snapshot.patch };

export const championList = snapshot.champions as ChampionListEntry[];
