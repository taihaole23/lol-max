// The "How it's calculated" rules, the items the filter removed, and the sources.
// Every game number in the text is read from the data files, so it can't drift from what the
// simulation actually uses.
import { simulationRules } from "../data/game-rules.ts";
import { katarina } from "../data/katarina.ts";
import { PATCH } from "../data/patch.ts";
import { sourceGroups } from "../data/sources.ts";
import { legendaryPool } from "../optimizer/item-pool.ts";
import { searchSettings } from "../optimizer/search.ts";
import { escapeHtml } from "./html.ts";

const r = katarina.deathLotus;
const percents = (list: readonly number[]) => list.map((x) => `${Math.round(x * 100)}`).join(" / ") + "%";

export function rulesHtml(): string {
  const removed = legendaryPool().removedByFilter.map((item) => escapeHtml(item.name));
  return `
    <h2>How it's calculated</h2>

    <h3>What "damage" means</h3>
    <ul>
      <li><strong>One full channel, one target:</strong> all ${r.daggersPerTarget} daggers of one Death Lotus
        (${r.channelSeconds} s) hit one target dummy.</li>
      <li><strong>Channel window:</strong> on-hit, on-attack and item effects triggered during the channel count.
        Burns and other damage over time only count for the part that lands before the channel ends.</li>
      <li><strong>Overkill rule:</strong> the dummy never dies. Once a hit would kill it, it stays at
        ${simulationRules.minimumHp} HP and every later hit still counts in full. Effects that depend on the
        target's HP then see ${simulationRules.minimumHp} HP.</li>
      <li><strong>On-hit:</strong> each dagger applies on-hit and on-attack effects at ${percents(r.onHitEffectiveness)}
        of their damage, by R rank.</li>
      <li><strong>No runes</strong> (planned for version 2).</li>
    </ul>

    <h3>Item passives</h3>
    <ul>
      <li>Item actives don't count.</li>
      <li>Combat starts when R is cast, with Katarina standing right next to the dummy.</li>
      <li>Stacks that fill up on their own (Rod of Ages, Energized, Dead Man's Plate) are full when R is cast.
        Stacks earned by fighting (in-combat stacks, Mejai's) start at 0 and may build up during the ult.</li>
      <li>A few timings the wiki doesn't state (like exactly when the first dagger lands) are our best guess
        until they're measured in the game's Practice Tool.</li>
    </ul>

    <h3>Builds</h3>
    <ul>
      <li>Completed legendary items only. No duplicates, and at most one item from each item group
        (for example Void Staff and Terminus are both "Blight"), as in the real shop.</li>
      <li>Boots take their own slot. "Mid quest completed" switches to tier-3 boots. The extra boots slot from
        the bot lane quest is ignored.</li>
      <li>Up to ${searchSettings.everyBuildMaxItems} items, every legal build is tried. With more, the search adds one
        item at a time and keeps the best ${searchSettings.beamWidth} part-builds at each step: trying every
        build would take hours. Tests check it: with 3 items it finds the same top 5 as trying every build, and
        with 5 items + boots it finds the same top 5 as a much wider search (5,000 part-builds).</li>
    </ul>

    <h3>How items are credited</h3>
    <ul>
      <li>"What each item adds" = damage with the item − damage without it.</li>
      <li>Items boost each other (more AP makes every AP effect bigger), so those numbers don't add up to the
        total on their own. The difference is shown as "Item interactions", so the table still adds up.</li>
      <li>"By source" counts where each point of damage came from. Items that only give stats (no damage of
        their own) show up in "What each item adds" instead.</li>
    </ul>

    <h3>The target dummy</h3>
    <ul>
      <li>Its HP, armor and MR = the champion's base stats at its level + its items' plain HP, armor and MR.
        Champion abilities and item passives (shields, Thornmail's reflect...) are ignored.</li>
      <li>Any number you type in replaces the calculated one.</li>
    </ul>

    <h3>Items left out of the search</h3>
    <p>These items can't change Death Lotus's damage: nothing in the calculation reads any of their stats,
      and they have no passive that deals or boosts damage. Leaving them out makes the search faster
      without changing any result (a test checks this).</p>
    <p>${removed.length > 0 ? removed.join(", ") : "None."}</p>`;
}

export function sourcesHtml(): string {
  const groups = sourceGroups
    .map(
      (group) => `
        <h3>${escapeHtml(group.title)}</h3>
        <ul class="source-list">${group.sources
          .map(
            (s) =>
              `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a>` +
              ` <span class="muted">(patch ${escapeHtml(s.patch)})</span></li>`,
          )
          .join("")}</ul>`,
    )
    .join("");
  return `
    <h2>Sources</h2>
    <p>Every number comes from the League of Legends Wiki or from Riot's own item data, for patch
      <strong>${PATCH}</strong>. Item base stats are a saved snapshot, so results only change when the
      site is updated to a new patch.</p>
    ${groups}`;
}
