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
};

export const championListSource = { url: snapshot.source, patch: snapshot.patch };

export const championList: ChampionListEntry[] = snapshot.champions;
