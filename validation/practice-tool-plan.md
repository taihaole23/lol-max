# Practice Tool test plan (Step 8)

Goal: cast Death Lotus on the Practice Tool dummy with known builds, write down the damage, and check
the calculator gets the same number. Patch: **26.23**. About 45-60 minutes for all 16 tests.

Dummy facts used here (wiki, Practice Tool page): starts at 1000 HP, 0 armor, 0 MR; can't drop below
1 HP; shows **total damage** above itself; resets (and clears the counter) 3 s after the last hit.

## 1. Rune page ("neutral": can't add damage to R)

| Slot | Pick | Why it's safe |
|---|---|---|
| Resolve keystone | **Guardian** | A shield, no damage, no stats |
| Resolve row 1 | **Demolish** | Damage to turrets only |
| Resolve row 2 | **Second Wind** | Healing only |
| Resolve row 3 | **Unflinching** | Armor / MR while CC'd only |
| Inspiration | **Cash Back** | Gold only |
| Inspiration | **Cosmic Insight** | Summoner / item haste only |
| Shard 1 | **Ability haste** | Doesn't change one cast's damage |
| Shard 2 | **Move speed** | Only Swiftmarch reads move speed, and it's not tested |
| Shard 3 | **Tenacity and slow resist** | No damage stat |

Avoid the health shards: Riftmaker turns HP into AP (test 13). Avoid adaptive and attack speed: both add R damage.

## 2. Setup (once)

1. Practice Tool, **Katarina**, the rune page above.
2. Turn on **Auto-Refresh Cooldowns** (Shift+X) so R is always ready.
3. Spawn an **enemy** dummy (Shift+B) in an open spot.
4. Raise its HP to **3000**: press **Ctrl+Shift+T** 20 times (+100 each).
5. Click the dummy and check its stats panel says 3000 HP, 0 armor, 0 MR.

## 3. For every test

1. Get to the test's **level** with **Level Up** (Shift+Y). Put a point in **R** at 6, 11 and 16.
   Other points can go anywhere, but **never cast Q, W or E**, and never auto-attack the dummy.
2. Buy exactly the test's items (Add Gold is Shift+T). Sell everything else. **No boots.**
3. Set the dummy's HP / resist if the test says so (step 4 below).
4. Wait **10 seconds** without touching the dummy (items like Luden's refill, in-combat timers reset).
5. Walk right next to the dummy and press **R**. Don't move until the ult ends.
6. Read the dummy's **total damage** right away: it clears 3 s after the last hit.
   Tip: press **F12** for a screenshot the moment the ult ends.
   **Better (learned in round 2):** click the dummy first, record the ult, and read its **HP** right
   after the last dagger. The total damage counter adds one of R's physical hits that never happened;
   the HP bar is exact. Put HP readings in `hpAfter` in `tests/practice-tool-cases.ts`.
7. Do it **twice** and write down both numbers.

**Changing the dummy's resistances:** Ctrl+Shift+G adds 10 (Ctrl+Shift+H removes 10). Tests 4 and 8 need
**50**: press it 5 times. Click the dummy to check that **both armor and MR** say 50. If only one changes,
tell me. Set it back to 0 afterwards.

## 4. The tests

Suggested order: all the level 6 tests, then level 11, then level 16 (Level Up only goes up).

| # | Level | R rank | Items | Dummy HP / resist | Checks | Calculator says | You measured |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 1 | none | 3000 / 0 | Base damage, rank 1 | 375 | |
| 9 | 6 | 1 | Nashor's Tooth | 3000 / 0 | On-hit at 25% | 704 | |
| 2 | 11 | 2 | none | 3000 / 0 | Base damage, rank 2 | 563 | |
| 4 | 11 | 2 | none | 3000 / **50** | Magic resist | 375 | |
| 8 | 11 | 2 | Void Staff | 3000 / **50** | Magic penetration | 641 | |
| 5 | 11 | 2 | Zhonya's Hourglass | 3000 / 0 | AP ratio | 862 | |
| 6 | 11 | 2 | Zhonya's + Rabadon's | 3000 / 0 | Rabadon's +AP% | 1433 | |
| 7 | 11 | 2 | Bloodthirster | 3000 / 0 | Bonus AD ratio | 899 | |
| 10 | 11 | 2 | Nashor's Tooth | 3000 / 0 | On-hit at 30% | 912 | |
| 12 | 11 | 2 | Liandry's Torment | 3000 / 0 | Burn + in-combat amp | 789 | |
| 14 | 11 | 2 | Luden's Echo | 3000 / 0 | Luden's on dagger 1 | 896 | |
| 15 | 11 | 2 | Blade of The Ruined King | 3000 / 0 | BotRK (reads current HP) | 1662 | |
| 16 | 11 | 2 | Guinsoo's Rageblade | 3000 / 0 | Guinsoo's stacks / Phantom Hits | 1052 | |
| 3 | 16 | 3 | none | 3000 / 0 | Base damage, rank 3 | 750 | |
| 11 | 16 | 3 | Nashor's Tooth | 3000 / 0 | On-hit at 35% | 1120 | |
| 13 | 16 | 3 | Riftmaker + Warmog's Armor | **4000** / 0 | HP → AP | 1050 | |

The "calculator says" column is from the code as of Step 8. `npm test` always recalculates it, so if the
code changes later, the test uses the new numbers.

**Most important:** tests 1-3. If those are off, something outside the items is adding damage (a rune,
Katarina's passive...), and the other tests can't be trusted until we find it.

## 4b. Round 2 (after round 1's results)

Round 1: 12 of 16 matched. Off: 7 Bloodthirster (+22), 12 Liandry's (+10, about one extra burn tick),
15 BotRK (+34), 16 Guinsoo's (+13). Round 2 narrows down test 7 and tries items together.

Same setup as before. Raise the dummy's HP where the table says (Ctrl+Shift+T, +100 each).

| # | Level | R rank | Items | Dummy HP / resist | Checks | Calculator says now | You measured |
|---|---|---|---|---|---|---|---|
| 7a | 6 | 1 | Bloodthirster | 3000 / 0 | Test 7 at low level | 632 | |
| 7c | 11 | 2 | Death's Dance | 3000 / 0 | Is it Bloodthirster itself? | 815 | |
| 7b | 16 | 3 | Bloodthirster | 3000 / 0 | Test 7 at high level | 1180 | |
| 17 | 16 | 3 | Guinsoo's + BotRK | **6000** / 0 | Phantom Hits repeat BotRK | 3963 (first listed as 3525: that was for 5000 HP) | |
| 18 | 16 | 3 | Guinsoo's + BotRK + Terminus | **5000** / **50** | All three together | 3252 | |
| 19 | 16 | 3 | Nashor's + Guinsoo's | **4000** / 0 | On-hit Katarina | 1841 | |
| 20 | 16 | 3 | Liandry's + Riftmaker | **4000** / 0 | Two % boosts together | 1262 | |
| 21 | 16 | 3 | Rabadon's + Luden's | **4000** / 0 | AP % on an item's ratio | 1665 | |

**Also, one quick check (no ult needed):** at level 11 with only Bloodthirster, open the stats panel
(**C**) and write down Katarina's **total AD** and **attack speed**. The calculator expects about
**166 AD** and **0.816 attack speed**. If the game shows more of either, that's the test 7 gap.

"Calculator says now" may change as round 1's mismatches get fixed; `npm test` always uses the current
numbers, so your measurements stay valid.

## 5. After testing

Send me the numbers (both tries per test), or put them in `tests/practice-tool-cases.ts`, in each case's
`measured: []`, like `measured: [376, 375]`. Then `npm test` compares them with the calculator. It
passes within 1% (or 3 damage).

Any test that's off gets logged in NOTES.md as bug / cause / fix. Tests 12, 15 and 16 also settle open
questions from NOTES.md ("Unconfirmed: to check in the Practice Tool"):
- **16:** do daggers give Guinsoo's stacks and Phantom Hits?
- **15:** does R's damage land before on-hit effects in the same dagger?
- **12:** when do Liandry's burn and in-combat stacks tick?
- All of them, a little: when does the first dagger land?
