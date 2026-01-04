import Event from "../../models/Event.js"
import { getIO } from "../../socket/index.js";
import { validationResult } from "express-validator";

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [events, totalEvents] = await Promise.all([
      Event.find({})
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      data: events,
      pagination: {
        totalEvents,
        totalPages: Math.ceil(totalEvents / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch events"
    });
  }
};

// Availability
export const availability = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: "Event not found",success: false});

    res.json(event.sections.map((sec) => ({
      id: sec._id,
      name: sec.name,      
      rows: sec.rows.map((row) => ({
        id: row._id,
        name: row.name,        
        availableSeats: row.totalSeats - row.bookedSeats,
      })),
    })));
  } catch (err) {
    res.status(400).json({success: false, message: "Invalid ID" });
  }
};

export const purchase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({success: false,errors: errors.array()});
    }
    const { section_id, row_id, quantity } = req.body;
    const eventId = req.params.id;

    if (!section_id || !row_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "section_id, row_id and quantity are required"
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number"
      });
    }

    const event = await Event.findOne({
      _id: eventId,
      "sections._id": section_id,
      "sections.rows._id": row_id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Invalid section or row"
      });
    }

    const sectionDoc = event.sections.id(section_id);
    if (!sectionDoc) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    const rowDoc = sectionDoc.rows.id(row_id);
    if (!rowDoc) {
      return res.status(404).json({
        success: false,
        message: "Row not found"
      });
    }

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
          { "s._id": section_id },
          { "r._id": row_id }
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

    const updatedSection = updatedEvent.sections.id(section_id);
    const updatedRow = updatedSection.rows.id(row_id);
    
    const io = getIO();
    io.to(eventId).emit("ticket-updated", {
      eventId,
      section_id,
      row_id,
      bookedSeats: updatedRow.bookedSeats,
      totalSeats: updatedRow.totalSeats
    });

    const groupDiscount = qty >= 4;

    return res.status(200).json({
      success: true,
      message: "Seats booked successfully",
      data: {
        section_id,
        row_id,
        quantity: qty,
        groupDiscount
      }
    });

  } catch (error) {
    console.error("Purchase error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
