export const NAME_LENGTH_MIN = 3;
export const NAME_LENGTH_MAX = 15;

export function isNameValid(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length >= NAME_LENGTH_MIN && trimmed.length <= NAME_LENGTH_MAX) {
    return true;
  }
  return false;
}
