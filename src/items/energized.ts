// Shared code for the "Energized" items (Rapid Firecannon, Statikk Shiv, Stormrazor).
//
// Moving and attacking fill an Energize bar up to 100. When it's full, the next attack's on-hit
// uses it all up for the item's bonus effect.
// - Stacks that fill up on their own are full at R cast (Eric's rule), so dagger 1 procs it.
// - Each dagger then adds 6 (wiki: abilities that apply on-hit generate 6). Katarina doesn't
//   move while channeling. 14 daggers × 6 = 84, so the bar never fills again: one proc per ult.
// Each item keeps its own bar. They all fill and empty the same way, so with 2 Energized
// items both proc on dagger 1, which matches the game ("stacks with other sources of it").
// ASSUMPTION (to check in the Practice Tool): daggers give only the plain 6, not Statikk's
//   "+9 per basic attack" (daggers aren't basic attacks). With 15 per dagger, Statikk would
//   proc 2 more times (daggers 8 and 15).
import type { EffectContext, ItemEffect } from "../simulation/simulate.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Template:Energized_info", patch: "26.23" },
  fullBar: 100,
  stacksPerDagger: 6,
};

export function energizedEffect(name: string, proc: (context: EffectContext) => void): ItemEffect {
  let energize = data.fullBar;
  return {
    name,
    onAttack: () => {
      energize = Math.min(energize + data.stacksPerDagger, data.fullBar);
    },
    onHit: (context) => {
      if (energize < data.fullBar) return;
      energize = 0;
      proc(context);
    },
  };
}
