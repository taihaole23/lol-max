// Runs the searches for the page and remembers their results.
//
// Two kinds of search:
//   - quick: the best 1 item + boots. ~15 ms, so it reruns on every change.
//   - full: every slot. Up to ~3 s, so it only runs when the user clicks Optimize.
//
// Each result remembers its "key": the exact request it answered, as text. The page only shows
// a result whose key matches the current inputs, so an out-of-date answer is never shown.
import type { SearchRequest, SearchResult } from "../optimizer/messages.ts";
import { cancelSearch, SearchCancelled, startSearch } from "../optimizer/start-search.ts";

type SearchKind = "quick" | "full";
type Found = { key: string; result: SearchResult };

export const searchStatus = {
  quick: null as Found | null,
  full: null as Found | null,
  running: null as { kind: SearchKind; key: string; fraction: number } | null,
  error: null as string | null,
};

// Two requests with the same key ask exactly the same question. No request (R not learned) = "".
export function keyOf(request: SearchRequest | null): string {
  return request === null ? "" : JSON.stringify(request);
}

// The page sets this so it can redraw whenever a search starts, progresses or finishes.
let onChange = () => {};
export function onSearchChange(callback: () => void): void {
  onChange = callback;
}

// Called after every input change, with the quick and full requests for the new inputs.
export function inputsChanged(quick: SearchRequest | null, full: SearchRequest | null): void {
  const running = searchStatus.running;
  const wantedKey = running?.kind === "quick" ? keyOf(quick) : keyOf(full);
  if (running && running.key !== wantedKey) {
    // It's answering a question nobody is asking any more.
    cancelSearch();
    searchStatus.running = null;
  }

  const quickKey = keyOf(quick);
  const alreadyHave = searchStatus.quick?.key === quickKey || searchStatus.running?.key === quickKey;
  if (quick && !alreadyHave) run("quick", quick);
  else onChange();
}

export function optimize(full: SearchRequest): void {
  run("full", full);
}

async function run(kind: SearchKind, request: SearchRequest): Promise<void> {
  const key = keyOf(request);
  searchStatus.running = { kind, key, fraction: 0 };
  searchStatus.error = null;
  onChange();

  try {
    const result = await startSearch(request, (fraction) => {
      if (searchStatus.running?.key !== key) return;
      searchStatus.running.fraction = fraction;
      onChange();
    });
    searchStatus[kind] = { key, result };
    searchStatus.running = null;
  } catch (error) {
    // Replaced by a newer search: that one owns `running` now, so leave everything alone.
    if (error instanceof SearchCancelled) return;
    searchStatus.running = null;
    searchStatus.error = error instanceof Error ? error.message : String(error);
  }
  onChange();
}

// What the page should show for the current inputs:
//   - the full result if it matches (every slot filled), otherwise
//   - the quick result if it matches (slot 1 + boots; `complete` when there's only 1 slot anyway).
export function shownResult(quick: SearchRequest | null, full: SearchRequest | null) {
  const fullKey = keyOf(full);
  if (full && searchStatus.full?.key === fullKey) return { result: searchStatus.full.result, complete: true };
  const quickKey = keyOf(quick);
  if (quick && searchStatus.quick?.key === quickKey) {
    return { result: searchStatus.quick.result, complete: quickKey === fullKey };
  }
  return null;
}
