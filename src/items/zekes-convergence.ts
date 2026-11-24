// Zeke's Convergence, "Frostfire Tempest": casting your ultimate summons a storm around you
// for 5 s (right away, since the dummy is next to Katarina). It deals 30 magic damage per
// second, dealt every 0.25 s (7.5 per tick). ("Cryocombustion", ultimate haste, doesn't change damage.)
//
// ASSUMPTION (to check in the Practice Tool): the first tick lands 0.25 s after R is cast,
// like Malignance. So 10 of its 20 ticks land inside the 2.5 s channel.
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Zeke%27s_Convergence", patch: "26.23" },
  stormSeconds: 5,
  ticksPerSecond: 4,
  damagePerSecond: 30,
};

export const zekesConvergence: ItemPassive = {
  name: "Zeke's Convergence",
  source: data.source,
  createEffect: () => ({
    name: "Zeke's Convergence",
    onUltCast: (context) => {
      const ticks = data.stormSeconds * data.ticksPerSecond;
      for (let i = 1; i <= ticks; i++) {
        context.schedule(i / data.ticksPerSecond, (later) => {
          later.dealDamage(data.damagePerSecond / data.ticksPerSecond, "magic");
        });
      }
    },
  }),
};
