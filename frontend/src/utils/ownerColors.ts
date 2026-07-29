export function getMemberColor(name: string | null | undefined) {
  const seed = (name || "unknown").toLowerCase();
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const saturation = 65;
  const lightness = 42;

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
