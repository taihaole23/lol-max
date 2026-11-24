// The whole job the worker does, as a plain function: search, explain each of the top 5, then find
// the best build of each style (AP, AD, attack speed).
// It's kept out of worker.ts so the tests can call it (Vitest runs in Node, which has no Web Workers).
import { explainBuild } from "./explain.ts";
import { legendaryPool } from "./item-pool.ts";
import type { ExplainedBuild, SearchRequest, SearchResult } from "./messages.ts";
import { findTopBuilds } from "./search.ts";
import { buildStyles, styleConstraints } from "./styles.ts";
import type { FoundBuild } from "./top-builds.ts";

// Progress is reported only when it has grown by at least this much (1%), so the worker
// sends ~100 messages instead of thousands.
const progressStep = 0.01;

// The main search fills the loading bar up to here; the style searches (smaller pools, faster)
// share the rest.
const mainSearchShare = 0.85;

export function runSearch(request: SearchRequest, onProgress: (fraction: number) => void = () => {}): SearchResult {
  let lastReported = 0;
  const report = (fraction: number) => {
    if (fraction === lastReported) return; // e.g. "100%" reported twice
    if (fraction - lastReported < progressStep && fraction < 1) return;
    lastReported = fraction;
    onProgress(fraction);
  };
  const explain = (build: FoundBuild): ExplainedBuild => ({
    ...build,
    explanation: explainBuild(request.level, build.items, request.target, request.rank, request.ability),
  });

  const builds = findTopBuilds({ ...request, onProgress: (f) => report(f * mainSearchShare) });

  const styleShare = (1 - mainSearchShare) / buildStyles.length;
  const styles = buildStyles.map((style, i) => {
    const start = mainSearchShare + i * styleShare;
    const best = findTopBuilds({
      ...request,
      constraints: styleConstraints(style.key, request.constraints),
      onProgress: (f) => report(start + f * styleShare),
    })[0];
    return { style: style.key, build: best ? explain(best) : null };
  });
  report(1);

  return { builds: builds.map(explain), styles, removedByFilter: legendaryPool().removedByFilter };
}
