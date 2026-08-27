const assert = require('assert');
const { encryptPinfl, decryptPinfl, hashPinflForLookup } = require('./crypto');

const pinfl = '12345678901234';

const encrypted = encryptPinfl(pinfl);
assert.notStrictEqual(encrypted, pinfl, 'shifrlangan qiymat asl matn bilan bir xil bo\'lmasligi kerak');
const decrypted = decryptPinfl(encrypted);
assert.strictEqual(decrypted, pinfl, 'deshifrlangan qiymat asl PINFLga teng bo\'lishi kerak');
console.log('OK: encryptPinfl -> decryptPinfl roundtrip');

const encrypted2 = encryptPinfl(pinfl);
assert.notStrictEqual(encrypted, encrypted2, 'har chaqiriqda IV tasodifiy bo\'lgani uchun natija boshqacha bo\'lishi kerak');
console.log('OK: har xil IV -> har xil ciphertext');

const hash1 = hashPinflForLookup(pinfl);
const hash2 = hashPinflForLookup(pinfl);
assert.strictEqual(hash1, hash2, 'bir xil PINFL uchun HMAC natijasi bir xil bo\'lishi kerak');
console.log('OK: hashPinflForLookup deterministik (duplikat qidiruv uchun mos)');

const differentHash = hashPinflForLookup('99999999999999');
assert.notStrictEqual(hash1, differentHash, 'har xil PINFL uchun har xil hash bo\'lishi kerak');
console.log('OK: har xil PINFL -> har xil hash');

console.log('\nBarcha crypto testlari muvaffaqiyatli o\'tdi.');
