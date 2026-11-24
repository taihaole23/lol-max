// Simulates one full Death Lotus channel against one target, one event at a time.
//
// It keeps a to-do list of things that will happen, each at a time in seconds
// (a dagger, a burn tick, a delayed hit...). It always runs the earliest one next.
// Anything that would happen after the channel ends is thrown away (the channel window rule).
import { katarina } from "../data/katarina.ts";
import { daggerPhysicalDamage, type RRank } from "../formulas/death-lotus.ts";
import { addShred, damageMultiplier, effectiveResist, type ResistShred } from "../formulas/resistance.ts";
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
  level: number; // the level her stats use (after Rod of Ages' extra level). Kraken Slayer reads it.
  ap: number; // already includes every % AP bonus below
  // All % AP bonuses added together (Rabadon's 0.3 + Blackfire's 0.04 = 0.34). They ADD to
  // each other (wiki), so an item that adds one mid-ult needs to know the total so far.
  apPercentBonus: number;
  // Move speed, only read by Swiftmarch (before the ult). Flat = base + flat bonuses (boots);
  // percent = all % bonuses added together (0.2 = +20%).
  flatMoveSpeed: number;
  percentMoveSpeed: number;
  bonusAd: number;
  baseAd: number; // AD from her level alone (Spellblade uses it)
  health: number; // her maximum health; the dummy never hits back, so she's always full (Titanic Hydra uses it)
  baseHealth: number; // health from her level alone; health − baseHealth = bonus health (Sunfire uses it)
  critChance: number; // a fraction: 0.25 = 25%. R and on-hit can't crit, but Essence Reaver reads it
  bonusAttackSpeed: number; // a fraction: 0.5 = 50%
  armorShred: ResistShred;
  magicShred: ResistShred;
};

export type Target = {
  hp: number; // at the start of the ult, so also its maximum HP (the dummy starts full)
  bonusHp: number; // the part of `hp` that comes from items (Lord Dominik's uses it)
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
  target: Readonly<Target>; // read only: change it through dealDamage. `hp` is its CURRENT HP.
  targetMaxHp: number; // the dummy's HP when the ult started
  // Deal item damage. `raw` is before armor / MR; the simulation reduces it.
  dealDamage: (raw: number, type: DamageType) => void;
  // Run something later, e.g. a burn tick 0.5 s from now.
  schedule: (delaySeconds: number, run: (later: EffectContext) => void) => void;
  // Apply every item's on-hit effects once more, right now (Dusk and Dawn does this).
  applyOnHitEffects: () => void;
};

// What an item effect is told about a piece of damage (before its amount is known).
export type DamageInfo = {
  type: DamageType;
  fromItem: boolean; // false = R's own damage (ability damage)
};

// Shred an item gives right now, on top of Katarina's own penetration.
// Debuffs on the dummy (Black Cleaver's armor reduction) go here too: with one
// target, it makes no difference whose side they're counted on.
export type ItemShred = {
  armor?: Partial<ResistShred>;
  magic?: Partial<ResistShred>;
};

// An item's hand-coded passive. It may keep its own stacks, so create a new
// one for every simulation.
export type ItemEffect = {
  name: string;
  // Runs once when R is cast (time 0), before the first dagger.
  onUltCast?: (context: EffectContext) => void;
  // Runs once per dagger, like an attack being thrown ("on-attack" effects: Guinsoo's stacks,
  // Yun Tal, Energize stacks). NOT run again by repeat on-hits (Phantom Hit, Dusk and Dawn).
  onAttack?: (context: EffectContext) => void;
  // Runs every time on-hit effects are applied: once per dagger, plus any extra
  // times an item causes (Dusk and Dawn, Guinsoo's Phantom Hit).
  onHit?: (context: EffectContext) => void;
  // Run just before / just after any piece of damage lands (R's or an item's).
  // `amount` = the damage dealt, after armor / MR and every multiplier (Stormsurge adds it up).
  beforeDamage?: (context: EffectContext, damage: DamageInfo) => void;
  afterDamage?: (context: EffectContext, damage: DamageInfo, amount: number) => void;
  // The shred this item gives for damage landing at `time`. Asked every time damage is calculated.
  shred?: (time: number) => ItemShred;
  // "Deal X% more damage": what to multiply this piece of damage by (1.04 = 4% more).
  // Applied after armor / MR. Several items multiply together (wiki, Damage page).
  damageMultiplier?: (context: EffectContext, damage: DamageInfo) => number;
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

  // Katarina's own shred plus what every item gives at this moment.
  function shredAt(time: number, resist: "armor" | "magic"): ResistShred {
    let shred = resist === "armor" ? attacker.armorShred : attacker.magicShred;
    for (const item of input.items) {
      const extra = item.shred?.(time)[resist];
      if (extra) shred = addShred(shred, extra);
    }
    return shred;
  }

  function multiplierFor(type: DamageType, time: number): number {
    if (type === "true") return 1;
    if (type === "physical") {
      return damageMultiplier(effectiveResist(target.baseArmor, target.bonusArmor, shredAt(time, "armor")));
    }
    return damageMultiplier(effectiveResist(target.baseMagicResist, target.bonusMagicResist, shredAt(time, "magic")));
  }

  function dealDamage(time: number, raw: number, type: DamageType, source: string, fromItem: boolean): void {
    // 0 damage (e.g. R's AD part with no bonus AD) isn't really dealt, so it can't add stacks.
    const info: DamageInfo = { type, fromItem };
    const dealt = raw > 0;
    if (dealt) {
      for (const item of input.items) item.beforeDamage?.(contextAt(time, item), info);
    }

    let amount = raw * multiplierFor(type, time);
    for (const item of input.items) {
      if (item.damageMultiplier) amount *= item.damageMultiplier(contextAt(time, item), info);
    }
    events.push({ time, amount, type, source, fromItem });
    target.hp = hpAfterHit(target.hp, amount);

    if (dealt) {
      for (const item of input.items) item.afterDamage?.(contextAt(time, item), info, amount);
    }
  }

  function contextAt(time: number, item: ItemEffect): EffectContext {
    return {
      time,
      rank: input.rank,
      onHitEffectiveness: r.onHitEffectiveness[input.rank - 1],
      attacker,
      target,
      targetMaxHp: input.target.hp,
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

  // The order inside one dagger, MEASURED in the Practice Tool (Step 8, patch 26.23):
  //   1. on-hit effects (they read the dummy's HP BEFORE this dagger's damage: BotRK, Kraken),
  //   2. R's own damage,
  //   3. on-attack effects (so Guinsoo's attack speed only helps the NEXT dagger).
  // Evidence: Guinsoo's + BotRK left the dummy at 2003 HP; "on-hit first" predicts 1998,
  // "R's damage first" (our first guess) predicts 2037. Guinsoo's-only tests fit step 3 as is.
  function throwDagger(time: number): void {
    applyOnHitEffects(time);

    // The magic part is dealt as two pieces, so the breakdown can show "base" and
    // "AP ratio" separately. MR reduces both by the same share.
    dealDamage(time, r.magicBaseDamage[input.rank - 1], "magic", "base", false);
    dealDamage(time, r.magicApRatio * attacker.ap, "magic", "apRatio", false);
    dealDamage(time, daggerPhysicalDamage(attacker.bonusAd, attacker.bonusAttackSpeed), "physical", "bonusAdRatio", false);

    for (const item of input.items) {
      item.onAttack?.(contextAt(time, item));
    }
  }

  for (const item of input.items) {
    item.onUltCast?.(contextAt(0, item));
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
