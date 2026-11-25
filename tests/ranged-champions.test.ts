// The ranged champions (Lux, Caitlyn, Veigar, Ezreal) and what was built for them:
// - abilities described as data (src/simulation/ability-spec.ts) and its two modifiers,
// - each champion's numbers, checked against the wiki's totals and worked out by hand,
// - ranged item numbers, item auras at attack range, Runaan's Hurricane,
// - Veigar's stacks box.
import { test, expect } from "vitest";
import { caitlyn } from "../src/data/caitlyn.ts";
import { ezreal } from "../src/data/ezreal.ts";
import { getItem } from "../src/data/items.ts";
import { lux } from "../src/data/lux.ts";
import { PATCH } from "../src/data/patch.ts";
import { isModelled, kitOf, rangeOf, type PlayableChampionId } from "../src/data/playable-champions.ts";
import { veigar } from "../src/data/veigar.ts";
import { itemPassives } from "../src/items/index.ts";
import { insideAura, meleeWielder, type Wielder } from "../src/items/types.ts";
import { hitParts, modifierBonus, specCast, specRule, type AbilitySpec } from "../src/simulation/ability-spec.ts";
import { abilityCast, damageRule } from "../src/simulation/abilities.ts";
import { simulateBuild } from "../src/simulation/simulate-build.ts";
import { breakdown } from "../src/simulation/breakdown.ts";
import { simulateCast, type Attacker, type Target } from "../src/simulation/simulate.ts";
import { findTopBuilds } from "../src/optimizer/search.ts";
import { sourceRows } from "../src/ui/breakdown-rows.ts";
import { recommendedRanks } from "../src/stats/ability-ranks.ts";
import { championStats } from "../src/stats/champion-stats.ts";
import * as actions from "../src/ui/state.ts";

// No armor or MR, and so much HP that the overkill rule never kicks in.
const bigDummy: Target = { hp: 1_000_000_000, bonusHp: 0, baseArmor: 0, bonusArmor: 0, baseMagicResist: 0, bonusMagicResist: 0 };
const total = (events: { amount: number }[]) => events.reduce((sum, e) => sum + e.amount, 0);
const items = (names: string[]) => names.map(getItem);

function cast(champion: PlayableChampionId, ability: "q" | "w" | "e" | "r", itemNames: string[] = [], target: Target = bigDummy, stacks = 0) {
  return simulateBuild(champion, 18, items(itemNames), target, ability === "r" ? 3 : 5, ability, stacks).events;
}
const stats = (champion: PlayableChampionId, itemNames: string[] = [], ability: "q" | "w" | "e" | "r" = "r", stacks = 0) =>
  championStats(champion, 18, items(itemNames), ability, stacks);
const itemDamage = (events: { source: string; amount: number }[], name: string) => total(events.filter((e) => e.source === name));
const abilityDamage = (events: { fromItem: boolean; amount: number }[]) => total(events.filter((e) => !e.fromItem));

// ---- The data shape (ability-spec.ts) ----

const attacker = { ...stats("ezreal"), ap: 100, bonusAd: 50, baseAd: 100, critChance: 0.5, critDamage: 2 } as Attacker;
const fullHp = { index: 0, targetHp: 1000, targetMaxHp: 1000 };

test("a part's base and ratios: one number for every rank, or one per rank", () => {
  const hit = { time: 0, parts: [{ type: "magic" as const, base: [10, 20, 30], ratios: { ap: [0.1, 0.2, 0.3], ad: 1, bonusAd: 0.5 } }] };
  const parts = hitParts(hit, 2, attacker, fullHp, undefined);
  expect(parts.map((p) => [p.source, p.raw])).toEqual([
    ["base", 20],
    ["apRatio", 20], // 0.2 × 100 AP
    ["adRatio", 150], // 1 × (100 base + 50 bonus AD): "AD" means TOTAL AD
    ["bonusAdRatio", 25], // 0.5 × 50 bonus AD
  ]);
  expect(parts.every((p) => p.type === "magic" && p.abilityDamage === undefined)).toBe(true);
});

test("missing-health modifier: grows evenly, capped (Veigar's R: +100% at 2/3 missing)", () => {
  const m = { kind: "missingHealth" as const, maxBonus: 1, missingForMax: 2 / 3 };
  const at = (hp: number) => modifierBonus(m, attacker, { index: 0, targetHp: hp, targetMaxHp: 1000 });
  expect(at(1000)).toBe(0);
  expect(at(800)).toBeCloseTo(0.3); // 20% missing × 1.5
  expect(at(500)).toBeCloseTo(0.75);
  expect(at(1000 / 3)).toBeCloseTo(1);
  expect(at(100)).toBe(1); // capped
});

test("crit-chance modifier: grows with crit chance and crit damage (Caitlyn's R: up to +30%, +39% with Infinity Edge)", () => {
  const m = { kind: "critChance" as const, maxBonus: 0.3 };
  const at = (critChance: number, critDamage: number) => modifierBonus(m, { ...attacker, critChance, critDamage }, fullHp);
  expect(at(0, 2)).toBe(0);
  expect(at(1, 2)).toBeCloseTo(0.3);
  expect(at(0.5, 2)).toBeCloseTo(0.15);
  expect(at(1, 2.3)).toBeCloseTo(0.39); // the wiki's "+ Infinity Edge 9%"
});

test("a modifier is its own line, on top of the hit's parts", () => {
  const hit = { time: 0, parts: [{ type: "magic" as const, base: [100], ratios: { ap: 1 } }], modifier: { kind: "missingHealth" as const, maxBonus: 1, missingForMax: 1 } };
  const parts = hitParts(hit, 1, attacker, { index: 0, targetHp: 500, targetMaxHp: 1000 }, undefined);
  expect(parts.at(-1)).toEqual({ raw: 100, type: "magic", source: "missingHealth" }); // 50% of (100 + 100)
});

test("the cast: hit times, the damage window and the flags", () => {
  const spec: AbilitySpec = {
    source: { url: "", patch: PATCH },
    hits: [
      { time: 0, name: "One", parts: [{ type: "physical", base: [1] }] },
      { time: 1.5, name: "Two", parts: [{ type: "physical", base: [1] }] },
    ],
    appliesOnHit: true,
    damageKind: "both",
  };
  const c = specCast(spec, "q", 1);
  expect(c.hitTimes).toEqual([0, 1.5]);
  expect(c.hitNames).toEqual(["One", "Two"]);
  expect(c.windowSeconds).toBe(4.5); // 3 s after the last hit
  expect(c.appliesOnHit).toBe(true);
  expect(c.appliesOnAttack).toBe(false);
  expect(c.basicDamage).toBe(true);
  expect(c.hitDamage(attacker, fullHp)[0].abilityDamage).toBe(true); // "both": basic AND ability damage
  expect(specRule(spec)).toBe("2 hits over 1.5 s, plus item effects up to 3 s after the last one.");
});

// ---- Each champion's data ----

const champions = { lux, caitlyn, veigar, ezreal };

test("every source is for the site's patch, and each champion is ranged with an attack range", () => {
  for (const kit of Object.values(champions)) {
    for (const group of [kit.baseStats, kit.abilities, kit.adaptiveType, kit.rangeType, ...Object.values(kit.specs)]) {
      expect(group.source.patch, kit.name).toBe(PATCH);
    }
    expect(kit.rangeType.type).toBe("ranged");
  }
  expect([lux, caitlyn, veigar, ezreal].map((k) => k.rangeType.attackRange)).toEqual([550, 650, 550, 550]);
});

test("base stats match the plan read from the wiki (2026-11-24)", () => {
  expect(lux.baseStats.health).toEqual({ base: 580, perLevel: 99 });
  expect(caitlyn.baseStats.attackDamage).toEqual({ base: 62, perLevel: 3.8 });
  expect(veigar.baseStats.attackSpeed).toEqual({ base: 0.625, bonusPerLevel: 0.0224 });
  expect(ezreal.baseStats.health).toEqual({ base: 600, perLevel: 102 });
  expect(lux.adaptiveType.whenTied).toBe("ap");
  expect(caitlyn.adaptiveType.whenTied).toBe("ad");
});

test("modelled abilities: the ones with damage; the others deal no damage", () => {
  expect(["q", "e", "r"].every((k) => isModelled("lux", k as "q"))).toBe(true);
  expect(isModelled("lux", "w")).toBe(false);
  expect(isModelled("caitlyn", "w")).toBe(false);
  expect(isModelled("veigar", "e")).toBe(false);
  expect(["q", "w", "e", "r"].every((k) => isModelled("ezreal", k as "q"))).toBe(true);
  expect(() => abilityCast("lux", "w", 1, false, attacker)).toThrow(/deals no damage/);
});

test("Veigar's R maximum is exactly 2x its minimum (the wiki's own table)", () => {
  // +100% at 2/3 missing health: 175 / 250 / 325 (+ 65 / 70 / 75% AP) → 350 / 500 / 650 (+ 130 / 140 / 150% AP).
  const r = veigar.specs.r.hits[0];
  expect(r.modifier.maxBonus).toBe(1);
  expect(r.modifier.missingForMax).toBeCloseTo(0.6666, 3);
});

// ---- Damage, worked out by hand (level 18, max rank, no armor or MR) ----

test("Lux: R = 500 + 120% AP, Q = 240 + 75% AP, E = 265 + 80% AP", () => {
  const ap = stats("lux", ["Rabadon's Deathcap"]).ap;
  expect(ap).toBeGreaterThan(0);
  expect(total(cast("lux", "r", ["Rabadon's Deathcap"]))).toBeCloseTo(500 + 1.2 * ap, 6);
  expect(total(cast("lux", "q", ["Rabadon's Deathcap"]))).toBeCloseTo(240 + 0.75 * ap, 6);
  expect(total(cast("lux", "e", ["Rabadon's Deathcap"]))).toBeCloseTo(265 + 0.8 * ap, 6);
  expect(damageRule("lux", "r")).toBe("One hit, plus item effects up to 3 s after it.");
});

test("Caitlyn: Q = 230 + 205% TOTAL AD", () => {
  // AD at 18: 62 + 3.8 × 17 × (0.7025 + 0.0175 × 17) = 62 + 64.6 = 126.6
  expect(stats("caitlyn").baseAd).toBeCloseTo(126.6, 6);
  expect(total(cast("caitlyn", "q"))).toBeCloseTo(230 + 2.05 * 126.6, 6);
});

test("Caitlyn: R = 650 + 100% bonus AD, then + 30% × crit chance × (crit damage − 1)", () => {
  expect(total(cast("caitlyn", "r"))).toBeCloseTo(650, 6); // no bonus AD, no crit
  const s = stats("caitlyn", ["Infinity Edge"]);
  expect(s.critChance).toBeGreaterThan(0);
  expect(s.critDamage).toBeCloseTo(2.3);
  const raw = 650 + s.bonusAd;
  expect(total(cast("caitlyn", "r", ["Infinity Edge"]))).toBeCloseTo(raw * (1 + 0.3 * s.critChance * 1.3), 6);
});

test("Veigar: stacks are AP, multiplied by Rabadon's like item AP", () => {
  expect(stats("veigar", [], "r", 100).ap).toBe(100);
  const without = stats("veigar", ["Rabadon's Deathcap"], "r", 0);
  const withStacks = stats("veigar", ["Rabadon's Deathcap"], "r", 100);
  expect(withStacks.ap - without.ap).toBeCloseTo(100 * (1 + without.apPercentBonus), 6);
  expect(total(cast("veigar", "q", [], bigDummy, 200))).toBeCloseTo(240 + 0.7 * 200, 6);
});

test("Veigar: W lands 1.2 s after the cast; items count until 4.2 s", () => {
  const w = abilityCast("veigar", "w", 5, false, attacker);
  expect(w.hitTimes).toEqual([1.2]);
  expect(w.windowSeconds).toBeCloseTo(4.2);
  expect(total(cast("veigar", "w", [], bigDummy, 100))).toBeCloseTo(305 + 1.1 * 100, 6);
  expect(damageRule("veigar", "w")).toBe("One hit, landing 1.2 s after the cast, plus item effects up to 3 s after it.");
});

test("Veigar: R grows with the dummy's missing health (the Health % box)", () => {
  const at = (share: number) => total(cast("veigar", "r", [], { ...bigDummy, startHpShare: share }, 100));
  const plain = 325 + 0.75 * 100;
  expect(at(1)).toBeCloseTo(plain, 6);
  expect(at(0.5)).toBeCloseTo(plain * 1.75, 3); // 50% missing → +75%
  expect(at(0.2)).toBeCloseTo(plain * 2, 3); // past 2/3 missing → +100%
});

test("Ezreal: Q = 120 + 130% TOTAL AD + 40% AP; W, E and R use BONUS AD", () => {
  const s = stats("ezreal", ["Rabadon's Deathcap"], "q");
  const ad = s.baseAd + s.bonusAd;
  expect(abilityDamage(cast("ezreal", "q", ["Rabadon's Deathcap"]))).toBeCloseTo(120 + 1.3 * ad + 0.4 * s.ap, 6);
  expect(total(cast("ezreal", "w", ["Rabadon's Deathcap"]))).toBeCloseTo(300 + 1.15 * s.bonusAd + s.ap, 6);
  expect(total(cast("ezreal", "e", ["Rabadon's Deathcap"]))).toBeCloseTo(280 + 0.6 * s.bonusAd + 0.75 * s.ap, 6);
  expect(total(cast("ezreal", "r", ["Rabadon's Deathcap"]))).toBeCloseTo(850 + 1.1 * s.bonusAd + 1.2 * s.ap, 6);
});

test("Ezreal: Q applies on-hit (ranged Blade of the Ruined King: 6%), W doesn't", () => {
  const q = cast("ezreal", "q", ["Blade of The Ruined King"]);
  // On-hit runs before Q's own damage, so it reads the dummy's full health.
  expect(itemDamage(q, "Blade of The Ruined King")).toBeCloseTo(0.06 * bigDummy.hp, 3);
  expect(itemDamage(cast("ezreal", "w", ["Blade of The Ruined King"]), "Blade of The Ruined King")).toBe(0);
});

test("Ezreal: Q is also ability damage (Luden's fires) and uses Spellblade (Trinity Force)", () => {
  expect(itemDamage(cast("ezreal", "q", ["Luden's Echo"]), "Luden's Echo")).toBeGreaterThan(0);
  expect(itemDamage(cast("ezreal", "q", ["Trinity Force"]), "Trinity Force")).toBeGreaterThan(0);
  // W and E apply no on-hit, so no Spellblade.
  expect(itemDamage(cast("ezreal", "e", ["Trinity Force"]), "Trinity Force")).toBe(0);
});

// ---- Ranged items ----

const ranged: Wielder = { ranged: true, distance: 550 };

// A made-up ranged ability: 5 physical hits, 0.5 s apart, applying on-hit and on-attack, basic AND
// ability damage, so every item below has something to react to.
const fiveHits = specCast(
  {
    source: { url: "", patch: PATCH },
    hits: [0, 0.5, 1, 1.5, 2].map((time) => ({ time, parts: [{ type: "physical" as const, base: [100] }] })),
    appliesOnHit: true,
    appliesOnAttack: true,
    damageKind: "both",
  },
  "q",
  1,
);

// The item's first damage event with a melee and a ranged wielder.
function firstItemHit(name: string, wielder: Wielder): number {
  const passive = itemPassives.find((p) => p.name === name)!;
  const a = championStats("ezreal", 18, [getItem(name)], "q");
  const result = simulateCast({ cast: fiveHits, attacker: a, target: bigDummy, items: [passive.createEffect!(wielder)] });
  const event = result.events.find((e) => e.source === name);
  if (!event) throw new Error(`${name} dealt no damage`);
  return event.amount;
}

test.each([
  ["Blade of The Ruined King", 6 / 9],
  ["Eclipse", 5 / 8],
  ["Titanic Hydra", 0.5],
  ["Voltaic Cyclosword", 6 / 8],
  ["Bastionbreaker", 0.5], // (20 + 0.75 per lethality) / (40 + 1.5 per lethality)
  ["Hullbreaker", 0.7],
])("%s: the ranged number is %f of the melee one", (name, ratio) => {
  expect(firstItemHit(name, ranged) / firstItemHit(name, meleeWielder)).toBeCloseTo(ratio, 6);
});

test("Kraken Slayer: ranged deals 80%, and stacks on-attack instead of on-hit", () => {
  // Melee procs before the 3rd hit's damage, ranged right after it: the dummy's missing health
  // differs by 100 out of a billion, so the ratio is 0.8 to 6 places.
  expect(firstItemHit("Kraken Slayer", ranged) / firstItemHit("Kraken Slayer", meleeWielder)).toBeCloseTo(0.8, 6);
  const kraken = itemPassives.find((p) => p.name === "Kraken Slayer")!;
  expect(kraken.createEffect!(ranged).onHit).toBeUndefined();
  expect(kraken.createEffect!(ranged).onAttack).toBeDefined();
});

test("Experimental Hexplate: ranged champions get half its attack speed on R (25% instead of 50%)", () => {
  const gain = (champion: PlayableChampionId) =>
    stats(champion, ["Experimental Hexplate"]).bonusAttackSpeed - stats(champion, ["Experimental Hexplate"], "q").bonusAttackSpeed;
  expect(gain("katarina")).toBeCloseTo(0.5);
  expect(gain("ezreal")).toBeCloseTo(0.25);
});

test("auras: in or out of reach at attack range", () => {
  expect(rangeOf("lux")).toEqual({ ranged: true, distance: 550 });
  expect(rangeOf("katarina")).toEqual({ ranged: false, distance: 0 });
  // Sunfire 325 (centred): 550 + 2 × 65 = 680 > 325.
  expect(insideAura(ranged, 325, "centred")).toBe(false);
  expect(insideAura(meleeWielder, 325, "centred")).toBe(true);
  // Abyssal Mask 700 (centre to edge): 550 + 65 = 615 in, 650 + 65 = 715 out.
  expect(insideAura(ranged, 700, "centre-to-edge")).toBe(true);
  expect(insideAura({ ranged: true, distance: 650 }, 700, "centre-to-edge")).toBe(false);
});

test("Sunfire Aegis deals nothing for Lux; Abyssal Mask boosts Lux but not Caitlyn", () => {
  expect(itemDamage(cast("lux", "r", ["Sunfire Aegis"]), "Sunfire Aegis")).toBe(0);
  expect(total(cast("lux", "r", ["Abyssal Mask"]))).toBeCloseTo(1.12 * (500 + 1.2 * stats("lux", ["Abyssal Mask"]).ap), 6);
  expect(total(cast("caitlyn", "e", ["Abyssal Mask"]))).toBeCloseTo(280 + 0.8 * stats("caitlyn", ["Abyssal Mask"]).ap, 6);
});

test("Unending Despair never saps from range (Veigar's W window reaches its 4 s sap)", () => {
  expect(itemDamage(cast("veigar", "w", ["Unending Despair"]), "Unending Despair")).toBe(0);
});

// ---- Veigar's stacks box and the presets ----

test("Veigar's stacks follow the stage presets and can be typed over", () => {
  let s = actions.selectChampion(actions.initialState(), "veigar");
  expect(s.stacks).toBe(50); // Early
  s = actions.applyStage(s, "full");
  expect(s.stacks).toBe(300);
  s = actions.setStacks(s, 87.4);
  expect(s.stacks).toBe(87);
  expect(actions.setStacks(s, -5).stacks).toBe(0);
  expect(actions.setStacks(s, null).stacks).toBe(300); // empty box: back to the preset
  expect(actions.championSetup({ ...s, ability: "r" })?.stacks).toBe(87);
  // Other champions: 0, and not sent to the search.
  const lux = actions.selectChampion(s, "lux");
  expect(lux.stacks).toBe(0);
  expect(actions.championSetup({ ...lux, ability: "r" })).not.toHaveProperty("stacks");
});

test("skill orders: Lux maxes E first, Veigar Q then W", () => {
  expect(recommendedRanks("lux", 9)).toMatchObject({ e: 5, r: 1 });
  expect(recommendedRanks("veigar", 13)).toEqual({ q: 5, w: 5, e: 1, r: 2 });
  expect(kitOf("ezreal").skillOrder.priority).toEqual(["r", "q", "e", "w"]);
});

// ---- The page and the search ----

test("Caitlyn's R breakdown shows the crit-chance bonus as its own line", () => {
  const rows = sourceRows(breakdown(cast("caitlyn", "r", ["Infinity Edge"])));
  expect(rows.map((r) => r.label)).toEqual(["Base damage", "Bonus AD ratio", "Crit-chance bonus"]);
});

test.each(["lux", "caitlyn", "veigar", "ezreal"] as const)("%s: the search finds 5 builds for every damaging ability (Mid)", (champion) => {
  for (const ability of ["q", "w", "e", "r"] as const) {
    if (!isModelled(champion, ability)) continue;
    let state = actions.selectAbility(actions.applyStage(actions.selectChampion(actions.initialState(), champion), "mid"), ability);
    const request = actions.fullSearchRequest(state)!;
    expect(request, `${champion} ${ability}`).not.toBeNull();
    const builds = findTopBuilds(request);
    expect(builds).toHaveLength(5);
    expect(builds[0].damage).toBeGreaterThan(0);
    state = actions.lockItem(state, 0, "Runaan's Hurricane"); // ranged-only, but they're all ranged
    expect(actions.conditionProblem(state)).toBeNull();
  }
});

test("a melee champion can't lock Runaan's Hurricane", () => {
  const state = actions.lockItem(actions.applyStage(actions.initialState(), "mid"), 0, "Runaan's Hurricane");
  expect(actions.conditionProblem(state)).toMatch(/isn't a completed item this champion can buy/);
});
