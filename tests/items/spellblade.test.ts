// The 5 Spellblade items: one proc, on the first dagger only.
import { test, expect } from "vitest";
import { run, baseAdAtLevel16 } from "./helpers.ts";

function spellbladeEvents(itemNames: string[], source: string) {
  return run(16, itemNames).events.filter((e) => e.source === source);
}

test("Spellblade procs once, on the first dagger (time 0)", () => {
  const events = spellbladeEvents(["Lich Bane"], "Lich Bane");
  expect(events).toHaveLength(1);
  expect(events[0].time).toBe(0);
});

test("Lich Bane: 75% base AD + 45% AP (100), magic, × 0.35", () => {
  const [event] = spellbladeEvents(["Lich Bane"], "Lich Bane");
  expect(event.type).toBe("magic");
  expect(event.amount).toBeCloseTo((0.75 * baseAdAtLevel16 + 0.45 * 100) * 0.35);
});

test("Trinity Force: 200% base AD, physical, × 0.35", () => {
  const [event] = spellbladeEvents(["Trinity Force"], "Trinity Force");
  expect(event.type).toBe("physical");
  expect(event.amount).toBeCloseTo(2 * baseAdAtLevel16 * 0.35);
});

test("Iceborn Gauntlet: 150% base AD, physical, × 0.35", () => {
  const [event] = spellbladeEvents(["Iceborn Gauntlet"], "Iceborn Gauntlet");
  expect(event.amount).toBeCloseTo(1.5 * baseAdAtLevel16 * 0.35);
});

test("Essence Reaver: 125% base AD + 0.5 per 1% crit chance (its own 25%)", () => {
  const [event] = spellbladeEvents(["Essence Reaver"], "Essence Reaver");
  expect(event.amount).toBeCloseTo((1.25 * baseAdAtLevel16 + 0.5 * 25) * 0.35);
});

test("Dusk and Dawn: 75% base AD + 10% AP (60), magic, × 0.35", () => {
  const [event] = spellbladeEvents(["Dusk and Dawn"], "Dusk and Dawn");
  expect(event.amount).toBeCloseTo((0.75 * baseAdAtLevel16 + 0.1 * 60) * 0.35);
});

test("Dusk and Dawn applies on-hit effects once more, 0.2 s after the first dagger", () => {
  const nashors = spellbladeEvents(["Dusk and Dawn", "Nashor's Tooth"], "Nashor's Tooth");
  expect(nashors).toHaveLength(16); // 15 daggers + 1 repeat
  expect(nashors.filter((e) => Math.abs(e.time - 0.2) < 1e-9)).toHaveLength(1);
  // The repeat doesn't trigger Spellblade again.
  expect(spellbladeEvents(["Dusk and Dawn", "Nashor's Tooth"], "Dusk and Dawn")).toHaveLength(1);
});

test("other Spellblade items don't repeat on-hit effects", () => {
  expect(spellbladeEvents(["Lich Bane", "Nashor's Tooth"], "Nashor's Tooth")).toHaveLength(15);
});

test("every simulation starts with Spellblade ready again", () => {
  run(16, ["Lich Bane"]);
  expect(spellbladeEvents(["Lich Bane"], "Lich Bane")).toHaveLength(1);
});
