import { Color } from '../enums';

export function getFontColorByNetChange(netChange: number): Color {
  if (netChange > 0) return Color.Up;
  if (netChange < 0) return Color.Down;
  return Color.Unchanged;
}
