// Async route handler'lardagi xatoni Express'ning markaziy xato
// ushlovchisiga (`app.js`dagi umumiy error handler) uzatadi — shu
// orqali foydalanuvchiga hech qachon stack trace ko'rsatilmaydi.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
