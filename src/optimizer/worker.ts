// The search worker: runs in its own thread, so the page doesn't freeze while it searches.
// The page starts it from start-search.ts. It gets one SearchRequest, sends progress messages,
// then sends the result.
import type { SearchRequest, WorkerMessage } from "./messages.ts";
import { runSearch } from "./run-search.ts";

// Every message is checked against WorkerMessage, so a typo in its shape is a type error.
const send = (message: WorkerMessage) => self.postMessage(message);

self.onmessage = (event: MessageEvent<SearchRequest>) => {
  const result = runSearch(event.data, (fraction) => send({ type: "progress", fraction }));
  send({ type: "result", result });
};
