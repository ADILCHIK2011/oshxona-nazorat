const crypto = require('crypto');
const { ENCRYPTION_KEY, HMAC_SECRET } = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM uchun tavsiya etilgan uzunlik

const encryptionKey = Buffer.from(ENCRYPTION_KEY, 'hex'); // 32 bayt

/**
 * PINFL (yoki boshqa nozik matn) ni AES-256-GCM bilan shifrlaydi.
 * Har chaqiriqda tasodifiy IV generatsiya qilinadi va natija bilan
 * birga saqlanadi: "iv:authTag:ciphertext" (hex).
 */
function encryptPinfl(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('encryptPinfl: bo\'sh bo\'lmagan matn kerak');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
}

/**
 * encryptPinfl orqali shifrlangan qiymatni asl matnga qaytaradi.
 */
function decryptPinfl(encrypted) {
  if (typeof encrypted !== 'string') {
    throw new Error('decryptPinfl: noto\'g\'ri kirish');
  }

  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('decryptPinfl: shifrlangan qiymat formati noto\'g\'ri');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * PINFL bo'yicha duplikat qidirish uchun HMAC-SHA256 xash.
 * AES-GCM natijasi har safar boshqacha chiqadi (tasodifiy IV tufayli),
 * shuning uchun tenglik solishtirish uchun yaramaydi — buning o'rniga
 * shu determinstik HMAC ishlatiladi va bazada indekslanadi. Oddiy
 * SHA-256 emas, aynan HMAC ishlatiladi: bu PINFL kabi cheklangan
 * formatdagi (taxmin qilinishi oson) qiymatni kalitsiz offline
 * qidirish/rainbow table xavfini kamaytiradi.
 */
function hashPinflForLookup(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('hashPinflForLookup: bo\'sh bo\'lmagan matn kerak');
  }

  return crypto.createHmac('sha256', HMAC_SECRET).update(plain, 'utf8').digest('hex');
}

module.exports = { encryptPinfl, decryptPinfl, hashPinflForLookup };
