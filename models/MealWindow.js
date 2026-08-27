const { Schema, model } = require('mongoose');

const mealWindowSchema = new Schema(
  {
    name: { type: String, required: true },
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true }, // "HH:mm"
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = model('MealWindow', mealWindowSchema);
