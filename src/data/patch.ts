// The patch the site's numbers are for. Shown on the site.
//
// Every hand-typed number's `source` says which patch someone last CHECKED it on, written out as
// a plain string (like "26.23"), never borrowed from PATCH. (Borrowing PATCH would make every
// number claim the new patch the moment this line changes, even ones nobody re-checked.)
//
// So when this changes, tests/patch-check.test.ts fails and lists every source still on the old
// patch. Re-check each one on its page, fix the numbers if they changed, then update its patch.
// The whole patch-day routine: `npm run patch-day` (or /patch-day in Claude Code).
export const PATCH = "26.23";
