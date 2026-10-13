export function contrastRatio(foreground: string, background: string): number | null {
  const luminance = (color: string): number | null => {
    const match = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (!match) return null;
    const hex = match[1]!.length === 3 ? [...match[1]!].map(part => part + part).join('') : match[1]!;
    const values = [0, 2, 4].map(index => { const value = parseInt(hex.slice(index, index + 2), 16) / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
    return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722;
  };
  const first = luminance(foreground), second = luminance(background);
  return first === null || second === null ? null : (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
