import Event from "../../models/Event.js"
import { io } from "../../../server.js";

// create event
export const createEvent =  async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(200).json({success:true,message:"Event created successfully","data":event});
  } catch (err) {
    res.status(400).json({ success:false,message: err.message });
  }
};

//event lists
export const listEvent = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ _id: -1 });
    return res.status(200).json({success: true,"data":events});
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({success: false,message: "Failed to fetch events"});
  }
};

// Availability
export const availability = async (req, res) => {
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
    res.status(400).json({success: false, message: "Invalid ID" });
  }
};

//purchase
export const purchase = async (req, res) => {
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

    const updatedEvent = await Event.findById(eventId);

    io.to(eventId).emit("ticket-updated", {
      eventId,
      section,
      row,
      bookedSeats: updatedEvent.sections
        .find(s => s.name === section)
        .rows.find(r => r.name === row).bookedSeats,
      totalSeats: rowDoc.totalSeats
    });

    const groupDiscount = qty >= 4;

    return res.status(200).json({
      success: true,
      message: "Seats booked successfully",
      data: {section,row,quantity: qty,groupDiscount}
    });

  } catch (error) {
    return res.status(500).json({success: false,message: "Internal server error"});
  }
};