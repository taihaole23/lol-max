// Sundered Sky, "Lightshield Strike": your next basic attack against a champion critically strikes
// for 80% of your total critical damage (10 s cooldown per target), and heals you.
//
// 80% of total crit damage: 0.8 × 200% = 160% normally, 0.8 × 230% = 184% with Infinity Edge.
// The wiki writes the same thing as "(60% + Infinity Edge 24%) bonus damage".
// It "functions as a critical strike for all purposes" and only works on real basic attacks, not on
// abilities that are basic damage (Yone's Q). Of our abilities, only Garen's Q is a basic attack.
//
// It isn't an effect during the cast: it decides whether Q crits and how hard. simulate-build.ts
// reads `sunderedSkyData` for that. The heal does no damage, so it's left out.
import type { ItemPassive } from "./types.ts";

export const sunderedSkyData = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Sundered_Sky", patch: "26.23" },
  critDamageRatio: 0.8, // "80% total critical damage" (V26.01: reduced to 80% from 100%)
};

export const sunderedSky: ItemPassive = {
  name: "Sundered Sky",
  source: sunderedSkyData.source,
};
