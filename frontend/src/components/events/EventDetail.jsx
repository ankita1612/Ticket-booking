import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { socket } from "../../socket";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ticketSchema } from "../validations/event";

const API_URL = import.meta.env.VITE_API_URL;

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(ticketSchema),
    defaultValues: {
      section_id: "",
      row_id: "",
      quantity: 1,
    },
  });

  const selectedSection = watch("section_id");
  const selectedRow = watch("row_id");
  const quantity = watch("quantity");

  useEffect(() => {
    setValue("row_id", "");
  }, [selectedSection, setValue]);

  useEffect(() => {
  if (!quantity || quantity === "") {
    setValue("quantity", 1);
  }
}, [selectedRow, quantity, setValue]);


  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/events/${id}/availability`
      );
      setAvailability(res.data);
    } catch (error) {      
      console.error("Failed to load availability", error);
      if (error.response?.status === 404 || error.response?.status === 400) {
        navigate("/");
      }        
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.emit("join-event", id);

    socket.on("ticket-updated", (data) => {
      if (data.eventId === id) {
        fetchAvailability();
      }
    });

    return () => socket.off("ticket-updated");
  }, [id]);

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  const availableRows = useMemo(() => {
    return (
      availability.find((s) => s.id === selectedSection)?.rows || []
    );
  }, [availability, selectedSection]);

  const maxSeats = useMemo(() => {
    return (
      availableRows.find((r) => r.id === selectedRow)
        ?.availableSeats || 1
    );
  }, [availableRows, selectedRow]);

  const onSubmit = async (data) => {
    setMessage("");

    try {
      const res = await axios.post(
        `${API_URL}/events/${id}/purchase`,
        {
          section_id: data.section_id,
          row_id: data.row_id,
          quantity: Number(data.quantity),
        }
      );
      if(res.data.success==true){
        setMessage(
          res.data.data?.groupDiscount
            ? "Booked! Group discount applied"
            : "Booked successfully"
        );
        reset();
        fetchAvailability();
      }
    } catch (err) {      
      if (err.response?.status === 422 && err.response?.data?.errors) {
          setMessage(err.response.data.errors[0].msg);
        } else {
          setMessage(err.response?.data?.message || "Booking failed");
        }
    }
  };

  if (loading) {
    return <p className="text-center mt-4">Loading availability...</p>;
  }

  return (
    <div className="container my-5">
      <div className="row">        
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h4 className="fw-bold mb-3">Book Event Tickets</h4>

              {message && (
                <div className="alert alert-info">{message}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Section */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Section</label>
                  <select
                    className={`form-select ${errors.section_id ? "is-invalid" : ""}`}
                    {...register("section_id")}
                  >
                    <option value="">Select Section</option>
                    {availability.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">
                    {errors.section_id?.message}
                  </div>
                </div>

                {/* Row */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Row</label>
                  <select
                    className={`form-select ${errors.row_id ? "is-invalid" : ""}`}
                    {...register("row_id")}
                    disabled={!selectedSection}
                  >
                    <option value="">Select Row</option>
                    {availableRows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">
                    {errors.row_id?.message}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    className={`form-control ${errors.quantity ? "is-invalid" : ""}`}                                        
                    {...register("quantity")}
                  />
                  <div className="invalid-feedback">
                    {errors.quantity?.message}
                  </div>

                  {selectedSection && selectedRow && (
                    <small className="text-muted">
                      Maximum available seats: {maxSeats}
                    </small>
                  )}
                </div>

                {/* Actions */}
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success">
                    Buy Tickets
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => reset()}
                  >
                    Clear Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT — AVAILABILITY */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h4 className="fw-bold mb-3">
                <i className="fa-solid fa-chair me-2 text-primary"></i>
                Seat Availability
              </h4>

              <p className="text-muted mb-4">
                Live availability by section and row
              </p>

              {availability.length === 0 ? (
                <p className="text-muted">No availability data</p>
              ) : (
                availability.map((sec) => (
                  <div
                    key={sec.id}
                    className="border rounded p-3 mb-3"
                  >
                    {/* Section Header */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0">
                        <i className="fa-solid fa-layer-group me-2 text-secondary"></i>
                        {sec.name}
                      </h6>

                      <span className="badge bg-light text-dark">
                        {sec.rows.reduce(
                          (sum, r) => sum + r.availableSeats,
                          0
                        )}{" "}
                        seats avaiable
                      </span>
                    </div>

                    {/* Rows */}
                    <div className="row g-2">
                      {sec.rows.map((row) => {
                        const isSoldOut = row.availableSeats === 0;

                        return (
                          <div key={row.id} className="col-6 col-md-4">
                            <div
                              className={`border rounded p-2 text-center ${
                                isSoldOut
                                  ? "bg-light text-muted"
                                  : "bg-success bg-opacity-10"
                              }`}
                            >
                              <div className="fw-semibold">
                                {row.name}
                              </div>

                              <small
                                className={`fw-bold ${
                                  isSoldOut
                                    ? "text-danger"
                                    : "text-success"
                                }`}
                              >
                                {isSoldOut
                                  ? "Sold Out"
                                  : `${row.availableSeats} seats`}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
