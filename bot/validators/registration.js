const { z } = require('zod');

// Lotin va kirill (o'zbekcha maxsus harflar bilan) ism/familiya.
const nameSchema = z
  .string()
  .trim()
  .min(2, 'Kamida 2 ta belgi kiriting')
  .max(50, 'Juda uzun (50 belgidan oshmasin)')
  .regex(/^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ'ʼ\- ]+$/, 'Faqat harflardan foydalaning');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{9,15}$/, 'Telefon raqam formati noto\'g\'ri');

// O'zbekiston PINFL (JSHSHIR) — aniq 14 ta raqam.
const pinflSchema = z
  .string()
  .trim()
  .regex(/^\d{14}$/, 'PINFL aniq 14 ta raqamdan iborat bo\'lishi kerak');

const positionSchema = z
  .string()
  .trim()
  .min(2, 'Kamida 2 ta belgi kiriting')
  .max(100, 'Juda uzun (100 belgidan oshmasin)')
  .regex(/^[^<>{}$]*$/, 'Ruxsat etilmagan belgilar ishlatilgan');

module.exports = { nameSchema, phoneSchema, pinflSchema, positionSchema };
