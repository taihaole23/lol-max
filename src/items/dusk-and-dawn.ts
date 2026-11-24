// Dusk and Dawn, "Spellblade": 75% base AD + 10% AP bonus magic damage, first dagger only,
// and it applies on-hit effects to the target AGAIN 0.2 seconds later. (The healing doesn't matter.)
//
// The wiki notes that the second round doesn't trigger Spellblade again; our Spellblade code
// already only procs once.
// ASSUMPTIONS (to check in the Practice Tool): daggers trigger the second round too, and it
// uses R's on-hit effectiveness like a normal dagger. The wiki also lists a bug where the second
// round changes the damage type of on-hit effects; we ignore it because the note is unclear.
import { spellbladeEffect } from "./spellblade.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Dusk_and_Dawn", patch: "26.23" },
  baseAdRatio: 0.75,
  apRatio: 0.1,
  repeatDelaySeconds: 0.2,
};

export const duskAndDawn: ItemPassive = {
  name: "Dusk and Dawn",
  source: data.source,
  createEffect: () =>
    spellbladeEffect(
      "Dusk and Dawn",
      "magic",
      (a) => data.baseAdRatio * a.baseAd + data.apRatio * a.ap,
      (context) => context.schedule(data.repeatDelaySeconds, (later) => later.applyOnHitEffects()),
    ),
};
