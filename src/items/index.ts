// Every hand-coded item passive. Items that aren't here have no passive that changes
// Death Lotus damage (or aren't coded yet; see the item checklist in NOTES.md).
import type { Item } from "../data/items.ts";
import type { ItemPassive } from "./types.ts";
import { overlordsBloodmail } from "./overlords-bloodmail.ts";
import { rabadonsDeathcap } from "./rabadons-deathcap.ts";
import { riftmaker } from "./riftmaker.ts";
import { rodOfAges } from "./rod-of-ages.ts";
import { steraksGage } from "./steraks-gage.ts";
import { swiftmarch } from "./swiftmarch.ts";
import { warmogsArmor } from "./warmogs-armor.ts";

export const itemPassives: readonly ItemPassive[] = [
  overlordsBloodmail,
  rabadonsDeathcap,
  riftmaker,
  rodOfAges,
  steraksGage,
  swiftmarch,
  warmogsArmor,
];

// The passives of the items in a build, in the same order as the items.
export function passivesFor(items: readonly Item[]): ItemPassive[] {
  const passives: ItemPassive[] = [];
  for (const item of items) {
    const passive = itemPassives.find((p) => p.name === item.name);
    if (passive) passives.push(passive);
  }
  return passives;
}
