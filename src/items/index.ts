// Every hand-coded item passive. Items that aren't here have no passive that changes
// Death Lotus damage (or aren't coded yet; see the item checklist in NOTES.md).
import type { Item } from "../data/items.ts";
import type { ItemEffect } from "../simulation/simulate.ts";
import type { ItemPassive } from "./types.ts";
import { abyssalMask } from "./abyssal-mask.ts";
import { bastionbreaker } from "./bastionbreaker.ts";
import { blackCleaver } from "./black-cleaver.ts";
import { blackfireTorch } from "./blackfire-torch.ts";
import { bladeOfTheRuinedKing } from "./blade-of-the-ruined-king.ts";
import { bloodlettersCurse } from "./bloodletters-curse.ts";
import { deadMansPlate } from "./dead-mans-plate.ts";
import { duskAndDawn } from "./dusk-and-dawn.ts";
import { eclipse } from "./eclipse.ts";
import { essenceReaver } from "./essence-reaver.ts";
import { experimentalHexplate } from "./experimental-hexplate.ts";
import { guinsoosRageblade } from "./guinsoos-rageblade.ts";
import { hollowRadiance } from "./hollow-radiance.ts";
import { hullbreaker } from "./hullbreaker.ts";
import { icebornGauntlet } from "./iceborn-gauntlet.ts";
import { immortalPath } from "./immortal-path.ts";
import { krakenSlayer } from "./kraken-slayer.ts";
import { liandrysTorment } from "./liandrys-torment.ts";
import { lichBane } from "./lich-bane.ts";
import { lordDominiksRegards } from "./lord-dominiks-regards.ts";
import { ludensEcho } from "./ludens-echo.ts";
import { malignance } from "./malignance.ts";
import { nashorsTooth } from "./nashors-tooth.ts";
import { overlordsBloodmail } from "./overlords-bloodmail.ts";
import { rabadonsDeathcap } from "./rabadons-deathcap.ts";
import { rapidFirecannon } from "./rapid-firecannon.ts";
import { riftmaker } from "./riftmaker.ts";
import { rodOfAges } from "./rod-of-ages.ts";
import { shadowflame } from "./shadowflame.ts";
import { spearOfShojin } from "./spear-of-shojin.ts";
import { statikkShiv } from "./statikk-shiv.ts";
import { steraksGage } from "./steraks-gage.ts";
import { stormrazor } from "./stormrazor.ts";
import { stormsurge } from "./stormsurge.ts";
import { sunfireAegis } from "./sunfire-aegis.ts";
import { swiftmarch } from "./swiftmarch.ts";
import { terminus } from "./terminus.ts";
import { titanicHydra } from "./titanic-hydra.ts";
import { trinityForce } from "./trinity-force.ts";
import { voltaicCyclosword } from "./voltaic-cyclosword.ts";
import { warmogsArmor } from "./warmogs-armor.ts";
import { witsEnd } from "./wits-end.ts";
import { yunTalWildarrows } from "./yun-tal-wildarrows.ts";
import { zekesConvergence } from "./zekes-convergence.ts";

export const itemPassives: readonly ItemPassive[] = [
  abyssalMask,
  bastionbreaker,
  blackCleaver,
  blackfireTorch,
  bladeOfTheRuinedKing,
  bloodlettersCurse,
  deadMansPlate,
  duskAndDawn,
  eclipse,
  essenceReaver,
  experimentalHexplate,
  guinsoosRageblade,
  hollowRadiance,
  hullbreaker,
  icebornGauntlet,
  immortalPath,
  krakenSlayer,
  liandrysTorment,
  lichBane,
  lordDominiksRegards,
  ludensEcho,
  malignance,
  nashorsTooth,
  overlordsBloodmail,
  rabadonsDeathcap,
  rapidFirecannon,
  riftmaker,
  rodOfAges,
  shadowflame,
  spearOfShojin,
  statikkShiv,
  steraksGage,
  stormrazor,
  stormsurge,
  sunfireAegis,
  swiftmarch,
  terminus,
  titanicHydra,
  trinityForce,
  voltaicCyclosword,
  warmogsArmor,
  witsEnd,
  yunTalWildarrows,
  zekesConvergence,
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
