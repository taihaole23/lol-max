// Malignance, "Hatefog": damaging a champion with your ultimate creates a zone under them
// for 3 s. While inside it, they take 60 (+5% AP) magic damage per second, dealt every
// 0.25 s, and have 10 less MR. A new zone can't be made on the same target for 3 s, so
// one ult makes one zone. ("Scorn", ultimate haste, doesn't change damage.)
//
// The wiki says the first ult hit doesn't benefit from the MR reduction, so the -10 MR
// counts only for damage after the zone appears.
//
// ASSUMPTION (to check in the Practice Tool): the first tick lands 0.25 s after the zone
// appears. 3 s × 4 ticks = 12 ticks, which matches the wiki's "180 total". Ticks after
// the channel ends are thrown away (the channel window rule), so 10 ticks count.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Malignance", patch: PATCH },
  zoneSeconds: 3,
  ticksPerSecond: 4,
  damagePerSecond: 60,
  apRatioPerSecond: 0.05,
  flatMrReduction: 10,
};

export const malignance: ItemPassive = {
  name: "Malignance",
  createEffect: () => {
    let zoneTime: number | undefined; // when the zone appeared

    return {
      name: "Malignance",
      afterDamage: (context, damage) => {
        if (damage.fromItem || zoneTime !== undefined) return;
        zoneTime = context.time;

        const ticks = data.zoneSeconds * data.ticksPerSecond;
        for (let i = 1; i <= ticks; i++) {
          context.schedule(i / data.ticksPerSecond, (later) => {
            const perSecond = data.damagePerSecond + data.apRatioPerSecond * later.attacker.ap;
            later.dealDamage(perSecond / data.ticksPerSecond, "magic");
          });
        }
      },
      shred: (time) => {
        if (zoneTime === undefined || time <= zoneTime) return {};
        return { magic: { flatReduction: data.flatMrReduction } };
      },
    };
  },
};
