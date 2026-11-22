// Simulates one full Death Lotus channel against one target, one event at a time.
//
// It keeps a to-do list of things that will happen, each at a time in seconds
// (a dagger, a burn tick, a delayed hit...). It always runs the earliest one next.
// Anything that would happen after the channel ends is thrown away (the channel window rule).
import { katarina } from "../data/katarina.ts";
import { daggerPhysicalDamage, type RRank } from "../formulas/death-lotus.ts";
import { damageMultiplier, effectiveResist, type ResistShred } from "../formulas/resistance.ts";
import { hpAfterHit } from "./hp.ts";

const r = katarina.deathLotus;

export type DamageType = "magic" | "physical" | "true";

// One piece of damage. Every breakdown on the site is built from a list of these.
export type DamageEvent = {
  time: number; // seconds after the channel starts
  amount: number; // after armor / MR
  type: DamageType;
  source: string; // "base", "apRatio", "bonusAdRatio", or an item's name
  fromItem: boolean; // true = item effect, false = the ability itself
};

// Katarina's stats that matter for R. Item effects may change these mid-ult.
export type Attacker = {
  ap: number;
  bonusAd: number;
  baseAd: number; // AD from her level alone (Spellblade uses it)
  health: number; // her maximum health; the dummy never hits back, so she's always full (Titanic Hydra uses it)
  critChance: number; // a fraction: 0.25 = 25%. R and on-hit can't crit, but Essence Reaver reads it
  bonusAttackSpeed: number; // a fraction: 0.5 = 50%
  armorShred: ResistShred;
  magicShred: ResistShred;
};

export type Target = {
  hp: number;
  baseArmor: number;
  bonusArmor: number;
  baseMagicResist: number;
  bonusMagicResist: number;
};

// What an item effect gets to see and do when something happens.
export type EffectContext = {
  time: number;
  rank: RRank;
  onHitEffectiveness: number; // 0.25 / 0.30 / 0.35 for R rank 1 / 2 / 3
  attacker: Attacker; // may be changed, e.g. attack speed stacks
  target: Readonly<Target>; // read only: change it through dealDamage
  // Deal item damage. `raw` is before armor / MR; the simulation reduces it.
  dealDamage: (raw: number, type: DamageType) => void;
  // Run something later, e.g. a burn tick 0.5 s from now.
  schedule: (delaySeconds: number, run: (later: EffectContext) => void) => void;
  // Apply every item's on-hit effects once more, right now (Dusk and Dawn does this).
  applyOnHitEffects: () => void;
};

// An item's hand-coded passive. It may keep its own stacks, so create a new
// one for every simulation.
export type ItemEffect = {
  name: string;
  // Runs every time on-hit effects are applied: once per dagger, plus any extra
  // times an item causes (Dusk and Dawn).
  onHit?: (context: EffectContext) => void;
};

export type SimulationInput = {
  rank: RRank;
  attacker: Attacker;
  target: Target;
  items: ItemEffect[];
};

export type SimulationResult = {
  events: DamageEvent[];
  targetHpAtEnd: number;
};

type ToDo = { time: number; run: () => void };

export function simulateDeathLotus(input: SimulationInput): SimulationResult {
  // Copies, so that changes during the ult don't leak out to the caller.
  const attacker = { ...input.attacker };
  const target = { ...input.target };
  const events: DamageEvent[] = [];
  const todo: ToDo[] = [];

  function multiplierFor(type: DamageType): number {
    if (type === "true") return 1;
    if (type === "physical") {
      return damageMultiplier(effectiveResist(target.baseArmor, target.bonusArmor, attacker.armorShred));
    }
    return damageMultiplier(effectiveResist(target.baseMagicResist, target.bonusMagicResist, attacker.magicShred));
  }

  function dealDamage(time: number, raw: number, type: DamageType, source: string, fromItem: boolean): void {
    const amount = raw * multiplierFor(type);
    events.push({ time, amount, type, source, fromItem });
    target.hp = hpAfterHit(target.hp, amount);
  }

  function contextAt(time: number, item: ItemEffect): EffectContext {
    return {
      time,
      rank: input.rank,
      onHitEffectiveness: r.onHitEffectiveness[input.rank - 1],
      attacker,
      target,
      dealDamage: (raw, type) => dealDamage(time, raw, type, item.name, true),
      schedule: (delaySeconds, run) => {
        const later = time + delaySeconds;
        todo.push({ time: later, run: () => run(contextAt(later, item)) });
      },
      applyOnHitEffects: () => applyOnHitEffects(time),
    };
  }

  // Every item's on-hit effect, in build order.
  function applyOnHitEffects(time: number): void {
    for (const item of input.items) {
      item.onHit?.(contextAt(time, item));
    }
  }

  function throwDagger(time: number): void {
    // The magic part is dealt as two pieces, so the breakdown can show "base" and
    // "AP ratio" separately. MR reduces both by the same share.
    dealDamage(time, r.magicBaseDamage[input.rank - 1], "magic", "base", false);
    dealDamage(time, r.magicApRatio * attacker.ap, "magic", "apRatio", false);
    dealDamage(time, daggerPhysicalDamage(attacker.bonusAd, attacker.bonusAttackSpeed), "physical", "bonusAdRatio", false);

    // ASSUMPTION (to check in the Practice Tool): R's own damage lands first, then
    // on-hit effects. Only matters for effects that read the dummy's HP (BotRK).
    applyOnHitEffects(time);
  }

  for (let i = 0; i < r.daggersPerTarget; i++) {
    const time = r.firstDaggerSeconds + i * r.secondsBetweenDaggers;
    todo.push({ time, run: () => throwDagger(time) });
  }

  while (todo.length > 0) {
    // Find the earliest thing to do. On a tie, the one added first goes first.
    let next = 0;
    for (let i = 1; i < todo.length; i++) {
      if (todo[i].time < todo[next].time) next = i;
    }
    const [action] = todo.splice(next, 1);
    if (action.time <= r.channelSeconds) {
      action.run();
    }
  }

  return { events, targetHpAtEnd: target.hp };
}
