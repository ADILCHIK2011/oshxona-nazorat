require('dotenv').config();

const REQUIRED_VARS = [
  'BOT_TOKEN',
  'MONGODB_URI',
  'PORT',
  'ENCRYPTION_KEY',
  'HMAC_SECRET',
  'STATION_API_SALT',
];

function assertEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name] || process.env[name].trim() === '');

  if (missing.length > 0) {
    for (const name of missing) {
      console.error(`[ENV] ${name} topilmadi. .env faylini tekshiring (.env.example asosida).`);
    }
    throw new Error(`Majburiy env o'zgaruvchilar yo'q: ${missing.join(', ')}`);
  }

  if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY 32 baytli hex qator bo\'lishi kerak (64 ta hex belgi). Generatsiya: openssl rand -hex 32');
  }
}

assertEnv();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: Number(process.env.PORT),
  // Standart holatda faqat 127.0.0.1 — server tashqi tarmoqdan to'g'ridan
  // to'g'ri (nginx'ni chetlab) hech qachon ochilmasin. Faqat mahalliy
  // rivojlantirishda boshqa qurilmadan (masalan telefon) sinash kerak
  // bo'lsa, .env'da HOST=0.0.0.0 qo'yiladi.
  HOST: process.env.HOST || '127.0.0.1',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  HMAC_SECRET: process.env.HMAC_SECRET,
  STATION_API_SALT: process.env.STATION_API_SALT,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
