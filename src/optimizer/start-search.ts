// What the page calls to run a search. It starts a worker (worker.ts) and returns a Promise:
// a value that arrives later, which the page waits for with `await`.
//
// Only one search runs at a time. Starting a new one (the user changed a setting) stops the old
// worker and rejects its Promise with SearchCancelled, so an old answer never shows up late.
import type { SearchRequest, SearchResult, WorkerMessage } from "./messages.ts";

export class SearchCancelled extends Error {
  constructor() {
    super("The search was replaced by a newer one.");
  }
}

let cancelCurrent: (() => void) | undefined;

// Stops the running search, if any (its Promise rejects with SearchCancelled).
// The page calls this when the inputs change in a way that makes the running search pointless.
export function cancelSearch(): void {
  cancelCurrent?.();
}

export function startSearch(request: SearchRequest, onProgress: (fraction: number) => void): Promise<SearchResult> {
  cancelCurrent?.();

  // Vite sees `new URL("./worker.ts", import.meta.url)` and bundles the worker file on its own.
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

  return new Promise((resolve, reject) => {
    const finish = () => {
      worker.terminate(); // stops the thread
      if (cancelCurrent === cancel) cancelCurrent = undefined;
    };
    const cancel = () => {
      finish();
      reject(new SearchCancelled());
    };
    cancelCurrent = cancel;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        onProgress(message.fraction);
      } else {
        finish();
        resolve(message.result);
      }
    };
    worker.onerror = (error) => {
      finish();
      reject(new Error(`The search failed: ${error.message}`));
    };

    worker.postMessage(request);
  });
}
