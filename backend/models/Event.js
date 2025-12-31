const mongoose = require("mongoose");

const rowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 0
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    rows: {
      type: [rowSchema],
      required: true
    }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    sections: {
      type: [sectionSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: "__v"
  }
);

module.exports = mongoose.model("Event", eventSchema);
