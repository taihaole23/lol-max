// The messages the page and the search worker send each other.
// The browser COPIES a message when sending it between threads, so they hold plain data only
// (numbers, text, lists, objects), never functions.
import type { Item } from "../data/items.ts";
import type { Target } from "../simulation/simulate.ts";
import type { BuildExplanation } from "./explain.ts";
import type { BootsSetting } from "./item-pool.ts";
import type { KatarinaSetup } from "./setup.ts";
import type { FoundBuild } from "./top-builds.ts";

// Page → worker: what to search. Level, R rank and item count come from the page's inputs
// (a stage preset fills them in, and the user can change each one).
export type SearchRequest = KatarinaSetup & {
  target: Target; // the dummy's final stats (presets or typed-in numbers, worked out by the page)
  boots: BootsSetting;
};

// One of the top 5, with everything the site shows about it.
export type ExplainedBuild = FoundBuild & { explanation: BuildExplanation };

export type SearchResult = {
  builds: ExplainedBuild[]; // best first
  removedByFilter: Item[]; // listed on the site
};

// Worker → page: progress while searching, then the result once.
export type WorkerMessage = { type: "progress"; fraction: number } | { type: "result"; result: SearchResult };
