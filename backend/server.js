require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet())
app.use(express.urlencoded({ extended: true }));
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));


const Event = require("./models/Event"); 

// Routes
app.post("/events", async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(200).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//event lists
app.get("/events", async (req, res) => {
  const events = await Event.find({});
  res.json({success:true,"events":events});
});

// availability
app.get("/events/:id/availability", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event.sections.map((sec) => ({
      name: sec.name,
      rows: sec.rows.map((row) => ({
        name: row.name,
        availableSeats: row.totalSeats - row.bookedSeats,
      })),
    })));
  } catch (err) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

//purchase
app.post("/events/:id/purchase", async (req, res) => {
  try {
    const { section, row, quantity } = req.body;    
    const eventId = req.params.id;

    if (!section || !row || !quantity) {
      return res.status(400).json({
        success: false,
        message: "section, row and quantity are required"
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be a positive number"
      });
    }

    const eventCheck = await Event.findOne({
      _id: eventId,
      sections: {
        $elemMatch: {
          name: section,
          rows: { $elemMatch: { name: row } }
        }
      }
    });

    if (!eventCheck) {
      return res.status(404).json({
        success: false,
        message: "Invalid section or row"
      });
    }

    const sectionDoc = eventCheck.sections.find(s => s.name === section);
    const rowDoc = sectionDoc.rows.find(r => r.name === row);

    if (rowDoc.bookedSeats + qty > rowDoc.totalSeats) {
      return res.status(409).json({
        success: false,
        message: "Not enough seats available"
      });
    }

    const updateResult = await Event.updateOne(
      { _id: eventId },
      {
        $inc: {
          "sections.$[s].rows.$[r].bookedSeats": qty
        }
      },
      {
        arrayFilters: [
          { "s.name": section },
          { "r.name": row }
        ]
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message: "Booking failed. Please try again."
      });
    }

    const groupDiscount = qty >= 4;

    return res.status(200).json({
      success: true,
      message: "Seats booked successfully",
      data: {
        section,
        row,
        quantity: qty,
        groupDiscount
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
