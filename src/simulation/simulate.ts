// Simulates one cast of an ability against one target, one event at a time.
//
// It keeps a to-do list of things that will happen, each at a time in seconds
// (a dagger, a burn tick, a delayed hit...). It always runs the earliest one next.
// Anything that would happen after the ability's damage window is thrown away
// (Death Lotus: the channel window rule; other abilities: 3 s after their last hit).
//
// What each ability does (its hits, their damage, on-hit or not) is described as data in
// each champion's abilities file, so this file works the same for every ability.
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import type { RRank } from "../formulas/death-lotus.ts";
import { addShred, damageMultiplier, effectiveResist, type ResistShred } from "../formulas/resistance.ts";
import { deathLotusCast } from "./katarina-abilities.ts";
import { hpAfterHit } from "./hp.ts";

export type DamageType = "magic" | "physical" | "true";

// One piece of damage. Every breakdown on the site is built from a list of these.
export type DamageEvent = {
  time: number; // seconds after the channel starts
  amount: number; // after armor / MR
  type: DamageType;
  source: string; // "base", "apRatio", "adRatio", "bonusAdRatio", "missingHealth", or an item's name
  fromItem: boolean; // true = item effect, false = the ability itself
  hitName?: string; // the ability's own damage only, when its hits have names ("First cast", "Recast")
};

// One piece of an ability hit's own damage, before armor / MR.
export type DamagePart = { raw: number; type: DamageType; source: string };

// What a hit's damage may depend on besides the champion's stats: which hit it is, and the dummy's
// HP the moment it lands (before its own damage). Akali's R2 grows with the dummy's missing health.
export type HitInfo = {
  index: number; // 0 = the first hit in hitTimes
  targetHp: number;
  targetMaxHp: number;
};

// Everything the simulation needs to know about the ability being cast (built in each champion's
// abilities file, e.g. katarina-abilities.ts).
export type AbilityCast = {
  key: DamageAbilityKey;
  hitTimes: number[]; // when each hit lands, in seconds after the cast
  // Optional names, one per hit (Akali's E and R: "First cast", "Recast"). The site then splits the
  // ability's damage by hit. Without names (Katarina's daggers), it shows one "Ability" line.
  hitNames?: string[];
  windowSeconds: number; // damage landing after this is thrown away
  // The hit's own damage, worked out with the champion's stats AT THAT MOMENT (items can change them mid-ult).
  hitDamage: (attacker: Attacker, hit: HitInfo) => DamagePart[];
  appliesOnHit: boolean;
  appliesOnAttack: boolean;
  onHitEffectiveness: number; // on-hit damage is multiplied by this (R: 0.25 / 0.30 / 0.35)
  // Death Lotus BUG (wiki): its on-hit effectiveness also shrinks Liandry's, Blackfire's and
  // Luden's damage. 1 for every other ability.
  procEffectiveness: number;
  // True if the cast grants Spellblade before its own hits land, so its first on-hit uses it (R).
  spellbladeReadyForHits: boolean;
};

// The champion's stats that matter for their abilities. Item effects may change these mid-ult.
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
  baseAd: number; // AD from her level alone (Spellblade uses it; Shunpo's ratio is on base + bonus AD)
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
  ability: DamageAbilityKey; // the ability being cast ("r" = Death Lotus)
  onHitEffectiveness: number; // R: 0.25 / 0.30 / 0.35 for rank 1 / 2 / 3. E: 1.
  procEffectiveness: number; // the Death Lotus bug for Liandry's, Blackfire, Luden's (see AbilityCast)
  spellbladeReady: boolean; // false = this cast's hits can't use Spellblade (see AbilityCast)
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
  fromItem: boolean; // false = the ability's own damage (ability damage)
  // The ability's own damage only: which hit it belongs to (0 = the first in hitTimes). Each hit is
  // its own cast instance for Eclipse (Akali's E1 and E2 land together but are 2 casts).
  hitIndex?: number;
};

// Shred an item gives right now, on top of the champion's own penetration.
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
  // Runs once when the ability is cast (time 0), before its first hit. `context.ability` says which.
  onCast?: (context: EffectContext) => void;
  // Runs once per dagger, like an attack being thrown ("on-attack" effects: Guinsoo's stacks,
  // Yun Tal, Energize stacks). NOT run again by repeat on-hits (Phantom Hit, Dusk and Dawn).
  onAttack?: (context: EffectContext) => void;
  // Runs every time on-hit effects are applied: once per dagger, plus any extra
  // times an item causes (Dusk and Dawn, Guinsoo's Phantom Hit).
  onHit?: (context: EffectContext) => void;
  // Run just before / just after any piece of damage lands (the ability's or an item's).
  // `amount` = the damage dealt, after armor / MR and every multiplier (Stormsurge adds it up).
  beforeDamage?: (context: EffectContext, damage: DamageInfo) => void;
  afterDamage?: (context: EffectContext, damage: DamageInfo, amount: number) => void;
  // The shred this item gives for damage landing at `time`. Asked every time damage is calculated.
  shred?: (time: number) => ItemShred;
  // "Deal X% more damage": what to multiply this piece of damage by (1.04 = 4% more).
  // Applied after armor / MR. Several items multiply together (wiki, Damage page).
  damageMultiplier?: (context: EffectContext, damage: DamageInfo) => number;
};

export type CastInput = {
  cast: AbilityCast;
  attacker: Attacker;
  target: Target;
  items: ItemEffect[];
};

// The older shape, for Death Lotus only (most tests use it).
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

export function simulateCast(input: CastInput): SimulationResult {
  const cast = input.cast;
  // Copies, so that changes during the ult don't leak out to the caller.
  const attacker = { ...input.attacker };
  const target = { ...input.target };
  const events: DamageEvent[] = [];
  const todo: ToDo[] = [];

  // The champion's own shred plus what every item gives at this moment.
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

  // `hitIndex` is only given for the ability's own damage.
  function dealDamage(time: number, raw: number, type: DamageType, source: string, fromItem: boolean, hitIndex?: number): void {
    // 0 damage (e.g. R's AD part with no bonus AD) isn't really dealt, so it can't add stacks.
    const info: DamageInfo = { type, fromItem, hitIndex };
    const dealt = raw > 0;
    if (dealt) {
      for (const item of input.items) item.beforeDamage?.(contextAt(time, item), info);
    }

    let amount = raw * multiplierFor(type, time);
    for (const item of input.items) {
      if (item.damageMultiplier) amount *= item.damageMultiplier(contextAt(time, item), info);
    }
    const hitName = hitIndex === undefined ? undefined : cast.hitNames?.[hitIndex];
    events.push({ time, amount, type, source, fromItem, ...(hitName ? { hitName } : {}) });
    target.hp = hpAfterHit(target.hp, amount);

    if (dealt) {
      for (const item of input.items) item.afterDamage?.(contextAt(time, item), info, amount);
    }
  }

  function contextAt(time: number, item: ItemEffect): EffectContext {
    return {
      time,
      ability: cast.key,
      onHitEffectiveness: cast.onHitEffectiveness,
      procEffectiveness: cast.procEffectiveness,
      spellbladeReady: cast.spellbladeReadyForHits,
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

  // The order inside one hit, MEASURED for Death Lotus daggers in the Practice Tool (Step 8, patch 26.23):
  //   1. on-hit effects (they read the dummy's HP BEFORE this dagger's damage: BotRK, Kraken),
  //   2. the ability's own damage,
  //   3. on-attack effects (so Guinsoo's attack speed only helps the NEXT dagger).
  // Evidence: Guinsoo's + BotRK left the dummy at 2003 HP; "on-hit first" predicts 1998,
  // "R's damage first" (our first guess) predicts 2037. Guinsoo's-only tests fit step 3 as is.
  // ASSUMPTION: Shunpo (E) uses the same order. Abilities that don't apply on-hit / on-attack skip those steps.
  function landHit(time: number, index: number): void {
    if (cast.appliesOnHit) applyOnHitEffects(time);

    // Each part is dealt as its own piece, so the breakdown can show "base", "AP ratio"...
    // separately. Armor / MR reduce every piece of one type by the same share.
    // All parts are worked out first, from the dummy's HP before this hit (Akali's R2).
    const parts = cast.hitDamage(attacker, { index, targetHp: target.hp, targetMaxHp: input.target.hp });
    for (const part of parts) {
      dealDamage(time, part.raw, part.type, part.source, false, index);
    }

    if (cast.appliesOnAttack) {
      for (const item of input.items) {
        item.onAttack?.(contextAt(time, item));
      }
    }
  }

  for (const item of input.items) {
    item.onCast?.(contextAt(0, item));
  }

  cast.hitTimes.forEach((time, index) => {
    todo.push({ time, run: () => landHit(time, index) });
  });

  while (todo.length > 0) {
    // Find the earliest thing to do. On a tie, the one added first goes first.
    let next = 0;
    for (let i = 1; i < todo.length; i++) {
      if (todo[i].time < todo[next].time) next = i;
    }
    const [action] = todo.splice(next, 1);
    if (action.time <= cast.windowSeconds) {
      action.run();
    }
  }

  return { events, targetHpAtEnd: target.hp };
}

// One Death Lotus. Kept for the tests written before Q and E existed.
export function simulateDeathLotus(input: SimulationInput): SimulationResult {
  const { rank, ...rest } = input;
  return simulateCast({ ...rest, cast: deathLotusCast(rank) });
}
