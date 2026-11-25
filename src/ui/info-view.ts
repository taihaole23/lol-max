// The "How it's calculated" rules, the items the filter removed, and the sources.
// Every game number in the text is read from the data files, so it can't drift from what the
// simulation actually uses.
import { simulationRules } from "../data/game-rules.ts";
import { akali } from "../data/akali.ts";
import { garen } from "../data/garen.ts";
import { katarina } from "../data/katarina.ts";
import { yone } from "../data/yone.ts";
import { PATCH } from "../data/patch.ts";
import { sourceGroups } from "../data/sources.ts";
import { sunderedSkyData } from "../items/sundered-sky.ts";
import { legendaryPool } from "../optimizer/item-pool.ts";
import { searchSettings } from "../optimizer/search.ts";
import { escapeHtml } from "./html.ts";

const r = katarina.deathLotus;
const e = katarina.shunpo;
const akaliR = akali.perfectExecution;
const yonePassive = yone.critPassive;
const judgment = garen.judgment;
const percents = (list: readonly number[]) => list.map((x) => `${Math.round(x * 100)}`).join(" / ") + "%";

export function rulesHtml(): string {
  const removed = legendaryPool().removedByFilter.map((item) => escapeHtml(item.name));
  return `
    <h2>How it's calculated</h2>

    <h3>What "damage" means: Katarina</h3>
    <ul>
      <li><strong>Death Lotus (R), one full channel, one target:</strong> all ${r.daggersPerTarget} daggers of one
        Death Lotus (${r.channelSeconds} s) hit one target dummy.</li>
      <li><strong>Channel window (R):</strong> on-hit, on-attack and item effects triggered during the channel count.
        Burns and other damage over time only count for the part that lands before the channel ends.</li>
      <li><strong>Bouncing Blade (Q) and Shunpo (E), one hit:</strong> one cast hits the dummy once (with one
        target, Q has nothing to bounce to). Item effects the hit starts count until they end, up to
        ${simulationRules.oneHitWindowSeconds} s after the hit. Every modelled burn is over by then; Sunfire's and
        Hollow Radiance's aura keeps itself going forever, so it's cut off there.</li>
      <li><strong>Preparation (W)</strong> deals no damage by itself, so it isn't calculated. Daggers on the ground
        (her passive) aren't modelled, so Q and E don't count picking one up either.</li>
      <li><strong>On-hit:</strong> each R dagger applies on-hit and on-attack effects at ${percents(r.onHitEffectiveness)}
        of their damage, by R rank. Shunpo (E) applies on-hit effects at ${percents([e.onHitEffectiveness])}.
        Bouncing Blade (Q) applies none.</li>
    </ul>

    <h3>What "damage" means: Akali</h3>
    <ul>
      <li><strong>She recasts as soon as the game allows.</strong> Item effects count until
        ${simulationRules.oneHitWindowSeconds} s after her last hit, the same rule as Katarina's Q and E.</li>
      <li><strong>Five Point Strike (Q):</strong> one hit.</li>
      <li><strong>Shuriken Flip (E):</strong> the first cast and the recast, both landing at the same moment. They
        are two separate casts (Eclipse counts both).</li>
      <li><strong>Perfect Execution (R):</strong> the first cast, then the recast ${akaliR.recastSeconds} s later
        (the game makes her wait ${akaliR.recastSeconds} s before she can recast). The recast deals up to
        ${Math.round(akaliR.maxMissingHealthBonus * 100)}% more damage based on the dummy's missing health: it grows
        evenly and reaches the maximum at ${Math.round(akaliR.missingHealthForMaxBonus * 100)}% missing health. It uses
        the dummy's HP the moment the recast lands, so a build whose first cast (and items) hurt more gets a bigger
        recast.</li>
      <li><strong>Twilight Shroud (W)</strong> deals no damage. Her passive (Assassin's Mark, an empowered basic
        attack) isn't modelled.</li>
      <li><strong>No on-hit:</strong> none of her abilities apply on-hit effects, so on-hit items and Spellblade
        never proc.</li>
    </ul>

    <h3>What "damage" means: Yone</h3>
    <ul>
      <li><strong>Mortal Steel (Q), Spirit Cleave (W) and Fate Sealed (R), one hit each:</strong> item effects the
        hit starts count until ${simulationRules.oneHitWindowSeconds} s after it, the same rule as Katarina's Q and E.</li>
      <li><strong>Q can critically strike.</strong> The page shows two numbers, "no crit / crit"
        (the crit one in red); at 100% crit chance Q always crits, so only the crit number is shown, and at 0% it can
        never crit, so only the no-crit number is shown. Builds are ranked by their peak: the crit whenever the build
        has any crit chance, otherwise the no-crit damage. The breakdowns show that peak.
        Only Q's AD part grows on a crit.</li>
      <li><strong>His passive:</strong> crit chance from items counts ${yonePassive.critChanceMultiplier}× (up to 100%),
        every 1% over 100% gives ${yonePassive.bonusAdPerExcessCrit / 100} bonus AD, and his crits deal
        ${Math.round(yonePassive.critDamageModifier * 100)}% of the usual crit damage. His mixed-damage basic
        attacks aren't modelled.</li>
      <li><strong>Q is basic damage:</strong> it applies on-hit and on-attack effects (and Spellblade) at full
        strength, but item effects that need <em>ability</em> damage (Liandry's, Blackfire, Luden's, Spear of
        Shojin, Bastionbreaker) don't trigger from it. Voltaic Cyclosword procs through Q's on-hit instead.</li>
      <li><strong>W</strong> deals equal parts physical and magic damage based on the dummy's maximum health.
        <strong>R</strong> deals equal parts magic and physical damage. Neither applies on-hit effects.</li>
      <li><strong>Soul Unbound (E)</strong> deals no damage by itself: it repeats part of the damage dealt during
        it, so it depends on a whole combo, and the site calculates one ability at a time.</li>
    </ul>

    <h3>What "damage" means: Garen</h3>
    <ul>
      <li><strong>Decisive Strike (Q), one empowered attack:</strong> a basic attack (100% AD) plus Q's bonus damage.
        The attack applies on-hit and on-attack effects (and Spellblade) at full strength and can critically strike,
        so the page shows "no crit / crit", the same rule as Yone's Q. The bonus never crits, and it counts as
        ability damage, so items that need ability damage (Liandry's, Luden's...) trigger from it. Item effects
        count until ${simulationRules.oneHitWindowSeconds} s after the hit. (A game bug that makes the bonus about
        6.5% bigger on a crit isn't counted.)</li>
      <li><strong>Sundered Sky on Q:</strong> Q is a real basic attack, so Sundered Sky's "Lightshield Strike"
        makes it crit every time, for ${Math.round(sunderedSkyData.critDamageRatio * 100)}% of the usual crit damage
        (160%, or 184% with Infinity Edge). It replaces the normal crit, so crit chance doesn't matter then, and only
        the crit number is shown. Yone's Q is basic damage but not a basic attack, so Sundered Sky does nothing for it.</li>
      <li><strong>Judgment (E), the whole spin:</strong> ${judgment.baseSpins} spins over ${judgment.spinSeconds} s,
        plus 1 for every ${Math.round(judgment.bonusAttackSpeedPerExtraSpin * 100)}% bonus attack speed (from items and
        levels) when E is cast. Each spin lands at the end of its turn, evenly spread. With one dummy it is always
        the nearest enemy, so every spin deals ${Math.round(judgment.nearestEnemyBonus * 100)}% more. After
        ${judgment.hitsForArmorReduction} spins the dummy has ${Math.round(judgment.armorReduction * 100)}% less armor.
        Spins don't apply on-hit effects. Item effects count until ${simulationRules.oneHitWindowSeconds} s after the
        last spin.</li>
      <li><strong>E's crits are averaged:</strong> a spin that crits deals ${Math.round((1 + judgment.critBonusShare) * 100)}%
        damage (more with Infinity Edge). With many spins, each one counts its average at your crit chance (at 40%
        crit, 40% of what a crit would add), so E shows one number.</li>
      <li><strong>Demacian Justice (R), one hit of true damage:</strong> its bonus grows with the dummy's
        <em>missing</em> health, so it depends on the dummy's "Health %" box (see the rules for every champion):
        at 100%, R is just its base damage. Its execute doesn't matter: the dummy never dies.</li>
      <li><strong>Courage (W)</strong> deals no damage, and neither does his passive (Perseverance).</li>
    </ul>

    <h3>Rules for every champion</h3>
    <ul>
      <li><strong>Overkill rule:</strong> the dummy never dies. Once a hit would kill it, it stays at
        ${simulationRules.minimumHp} HP and every later hit still counts in full. Effects that depend on the
        target's HP then see ${simulationRules.minimumHp} HP.</li>
      <li><strong>The dummy's health:</strong> the "Health %" box (100% to start) sets the dummy's health when the
        cast starts, for every ability. Missing-health damage (Garen's R, Akali's recast) and item effects that read
        the dummy's health (Shadowflame, Kraken Slayer, Blade of the Ruined King) all use it.</li>
      <li><strong>Ranks follow the game's rules:</strong> Q, W and E can reach rank 1 to 5 at levels 1, 3, 5, 7
        and 9, R reaches rank 1 to 3 at levels 6, 11 and 16, and all ranks together can't be more than the level.
        The stage presets level each champion the usual way: R whenever possible, then max Q, then E, then W
        (Yone: then W, then E; Garen and Lux: max E, then Q, then W; Veigar: max Q, then W, then E).</li>
      <li><strong>Veigar's passive stacks</strong> (Phenomenal Evil, +1 AP each) are a box you can edit. The stage
        presets fill in 50, 125, 200 and 300 stacks.</li>
      <li><strong>Travel time is ignored:</strong> missiles land the moment they're cast (Veigar's W still lands
        after its 1.2 s delay).</li>
      <li><strong>No runes</strong> (planned for version 2).</li>
    </ul>

    <h3>Item passives</h3>
    <ul>
      <li>Item actives don't count.</li>
      <li>Combat starts when R is cast (Katarina) or when the first hit lands. Melee champions stand right
        next to the dummy. Ranged champions (Lux, Caitlyn, Veigar, Ezreal) stand at their attack range, so items
        with an aura only count if the dummy is inside it: Sunfire Aegis and Hollow Radiance (325 units) and
        Unending Despair (650) never reach it; Abyssal Mask (700, measured to the dummy's edge) reaches it from
        550 but not from Caitlyn's 650.</li>
      <li>Items with separate melee and ranged numbers (Blade of the Ruined King, Kraken Slayer, Eclipse...)
        use the ranged numbers for ranged champions. Only ranged champions can buy Runaan's Hurricane.</li>
      <li>Items that work on your ultimate (Malignance, Zeke's Convergence, Experimental Hexplate) only count for R.
        For Katarina, Spellblade procs on R (first dagger) and on E's hit; her Q applies no on-hit effects, so it
        never procs.</li>
      <li>Stacks that fill up on their own (Rod of Ages, Energized, Dead Man's Plate) are full when R is cast.
        Stacks earned by fighting (in-combat stacks, Mejai's) start at 0 and may build up during the cast.</li>
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
      <li><strong>Minimum stats:</strong> only builds that reach every minimum you type are shown, top 5 and
        best-per-stat alike. The numbers are totals, as in the game's stat panel: base stats at your level + items
        + item passives that change stats (Rabadon's +30% AP, Yone's doubled crit chance). Armor, magic resist and
        ability haste count base stats and plain item stats only. Before you click Optimize, the quick answer (one
        item + boots) ignores the minimums: they're for the finished build.</li>
      <li><strong>Max:</strong> ranks builds by that stat instead of damage; damage breaks ties (so "Max crit"
        on Yone ranks every 100%-crit build by damage). With several, each stat is measured as a share of the most
        it can reach with your locks, bans and minimums, and the build whose WEAKEST share is highest wins: 75% of
        the best AP and 70% of the best AD beats 100% AP and 20% AD.</li>
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
    <p>These items can't change any calculated ability's damage: nothing in the calculation reads any of their stats,
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
