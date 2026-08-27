const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

// MUHIM: MongoDB HECH QACHON autentifikatsiyasiz yoki ochiq portda
// (0.0.0.0) ishga tushirilmasin. Ulanish satrida (MONGODB_URI) albatta
// username/password (yoki Atlas SRV satrida o'rnatilgan autentifikatsiya)
// bo'lishi shart — bu "defense in depth"ning bir qatlami. Agar mahalliy
// MongoDB ishlatilsa, u faqat 127.0.0.1'ga bog'lanishi (bindIp) va
// tashqi firewall orqali 27017-port yopiq bo'lishi kerak (README.md'ga
// qarang).
if (!/@/.test(MONGODB_URI) && !/^mongodb\+srv:/.test(MONGODB_URI)) {
  console.warn(
    '[DB] OGOHLANTIRISH: MONGODB_URI autentifikatsiya ma\'lumotlarisiz ko\'rinmoqda. ' +
      'Production muhitda bu qat\'iyan taqiqlanadi.'
  );
}

// MUHIM: mongoose.set('sanitizeFilter', true) ATAYIN o'rnatilmagan.
// U query filteridagi barcha $-operatorlarni (shu jumladan bizning
// o'zimiz yozgan, ishonchli $in/$addToSet kabi kodlarni ham) "zararli"
// deb hisoblab, ularni buzib qo'yadi. Untrusted kirish (masalan HTTP
// so'rov tanasi) uchun himoya allaqachon `express-mongo-sanitize`
// orqali API qatlamida (`api/app.js`) ta'minlangan; bot tomonida
// filterlar har doim ilova ichida qo'lda, qattiq nazorat ostida
// tuziladi (masalan `{ telegramId: ctx.from.id }`), shuning uchun
// bu yerda qo'shimcha sanitizatsiya kerak emas.

let connecting = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connecting) {
    return connecting;
  }

  connecting = mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    })
    .then((conn) => {
      console.log('[DB] MongoDB\'ga ulanildi.');
      connecting = null;
      return conn;
    })
    .catch((err) => {
      connecting = null;
      // Foydalanuvchiga/yuqori qatlamga to'liq stack chiqmaydi — faqat
      // serverga to'liq xato logga yoziladi.
      console.error('[DB] Ulanish xatosi:', err);
      throw new Error('Bazaga ulanib bo\'lmadi');
    });

  return connecting;
}

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB bilan aloqa uzildi, qayta ulanishga urinilmoqda...');
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB xatosi:', err);
});

module.exports = { connectDB, mongoose };
