
// Convert “Baby Food” → “babyFood”
export function toCamelCase(str) {
  return str
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0) {
        return word.toLowerCase();
      }
      // Uppercase first letter of each subsequent word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}