// The text in the middle of the progress bar while Optimize runs.
// Easter egg (Eric chose option A in planning): between 40% and 60% it asks thebausffs for advice.
export const easterEgg = {
  from: 0.4,
  to: 0.6,
  text: "getting advice from thebausffs...",
};

export function progressLabel(fraction: number): string {
  if (fraction >= easterEgg.from && fraction < easterEgg.to) return easterEgg.text;
  return `${Math.floor(fraction * 100)}%`;
}
