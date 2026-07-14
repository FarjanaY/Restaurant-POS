// Cosmetic only — menu items have no icon field, so this is a best-effort
// name-based lookup with a sensible fallback, not a stored/editable property.
const EMOJI_BY_KEYWORD = [
  [/drink|soda|juice|smoothie|coffee|latte/i, '🥤'],
  [/dessert|cake|ice cream|sweet/i, '🍰'],
  [/pizza/i, '🍕'],
  [/burger/i, '🍔'],
  [/pasta/i, '🍝'],
  [/appetizer|starter|spicy/i, '🌶️'],
  [/salad/i, '🥗'],
  [/sandwich/i, '🥪'],
];

export function categoryEmoji(name = '') {
  const match = EMOJI_BY_KEYWORD.find(([pattern]) => pattern.test(name));
  return match ? match[1] : '🍽️';
}
