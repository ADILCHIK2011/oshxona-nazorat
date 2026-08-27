const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { MealWindow, AdminConfig } = require('../models');

async function main() {
  await connectDB();

  await MealWindow.deleteMany({});
  await MealWindow.insertMany([
    { name: 'Nonushta', startTime: '08:00', endTime: '10:00', order: 1 },
    { name: 'Tushlik', startTime: '12:00', endTime: '14:00', order: 2 },
    { name: 'Kechki ovqat', startTime: '18:00', endTime: '20:00', order: 3 },
  ]);
  console.log('OK: 3 ta MealWindow yozildi.');

  await AdminConfig.findByIdAndUpdate('singleton', {}, { upsert: true, new: true });
  console.log('OK: AdminConfig singleton hujjati mavjudligi ta\'minlandi.');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('XATO:', e);
  process.exit(1);
});
