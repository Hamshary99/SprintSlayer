export function getMemberColor(name: string | null | undefined) {
  const seed = (name || "unknown").toLowerCase();
  let hash = 0;

  for (const character of seed) {
    hash = (character.codePointAt(0) ?? 0) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const saturation = 65;
  const lightness = 42;

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
