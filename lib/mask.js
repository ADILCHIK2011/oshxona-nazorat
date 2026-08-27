/**
 * PINFL kabi nozik qiymatlarni ko'rsatish uchun qisman yashiradi.
 * Faqat oxirgi 4 ta belgi ko'rinadi (masalan admin xabarlarida).
 */
function maskPinfl(pinfl) {
  if (typeof pinfl !== 'string' || pinfl.length <= 4) {
    return '••••';
  }
  return '•'.repeat(pinfl.length - 4) + pinfl.slice(-4);
}

module.exports = { maskPinfl };
