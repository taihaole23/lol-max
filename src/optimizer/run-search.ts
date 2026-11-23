// The whole job the worker does, as a plain function: search, then explain each of the top 5.
// It's kept out of worker.ts so the tests can call it (Vitest runs in Node, which has no Web Workers).
import { stages } from "../data/stages.ts";
import { explainBuild } from "./explain.ts";
import { legendaryPool } from "./item-pool.ts";
import type { SearchRequest, SearchResult } from "./messages.ts";
import { findTopBuilds } from "./search.ts";

// Progress is reported only when it has grown by at least this much (1%), so the worker
// sends ~100 messages instead of thousands.
const progressStep = 0.01;

export function runSearch(request: SearchRequest, onProgress: (fraction: number) => void = () => {}): SearchResult {
  let lastReported = 0;
  const builds = findTopBuilds({
    ...request,
    onProgress: (fraction) => {
      if (fraction - lastReported < progressStep && fraction < 1) return;
      lastReported = fraction;
      onProgress(fraction);
    },
  });

  const level = stages[request.stage].level;
  return {
    builds: builds.map((build) => ({ ...build, explanation: explainBuild(level, build.items, request.target) })),
    removedByFilter: legendaryPool().removedByFilter,
  };
}
