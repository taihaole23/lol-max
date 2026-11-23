// Every hand-coded item passive. Items that aren't here have no passive that changes
// Death Lotus damage (or aren't coded yet; see the item checklist in NOTES.md).
import type { Item } from "../data/items.ts";
import type { ItemEffect } from "../simulation/simulate.ts";
import type { ItemPassive } from "./types.ts";
import { blackCleaver } from "./black-cleaver.ts";
import { bladeOfTheRuinedKing } from "./blade-of-the-ruined-king.ts";
import { bloodlettersCurse } from "./bloodletters-curse.ts";
import { duskAndDawn } from "./dusk-and-dawn.ts";
import { essenceReaver } from "./essence-reaver.ts";
import { guinsoosRageblade } from "./guinsoos-rageblade.ts";
import { icebornGauntlet } from "./iceborn-gauntlet.ts";
import { lichBane } from "./lich-bane.ts";
import { malignance } from "./malignance.ts";
import { nashorsTooth } from "./nashors-tooth.ts";
import { overlordsBloodmail } from "./overlords-bloodmail.ts";
import { rabadonsDeathcap } from "./rabadons-deathcap.ts";
import { riftmaker } from "./riftmaker.ts";
import { rodOfAges } from "./rod-of-ages.ts";
import { steraksGage } from "./steraks-gage.ts";
import { swiftmarch } from "./swiftmarch.ts";
import { terminus } from "./terminus.ts";
import { titanicHydra } from "./titanic-hydra.ts";
import { trinityForce } from "./trinity-force.ts";
import { warmogsArmor } from "./warmogs-armor.ts";
import { witsEnd } from "./wits-end.ts";

export const itemPassives: readonly ItemPassive[] = [
  blackCleaver,
  bladeOfTheRuinedKing,
  bloodlettersCurse,
  duskAndDawn,
  essenceReaver,
  guinsoosRageblade,
  icebornGauntlet,
  lichBane,
  malignance,
  nashorsTooth,
  overlordsBloodmail,
  rabadonsDeathcap,
  riftmaker,
  rodOfAges,
  steraksGage,
  swiftmarch,
  terminus,
  titanicHydra,
  trinityForce,
  warmogsArmor,
  witsEnd,
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

// Fresh during-the-ult effects for a build, ready for the simulation.
export function effectsFor(items: readonly Item[]): ItemEffect[] {
  const effects: ItemEffect[] = [];
  for (const passive of passivesFor(items)) {
    if (passive.createEffect) effects.push(passive.createEffect());
  }
  return effects;
}
