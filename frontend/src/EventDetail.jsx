import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function EventDetail() {
  const { id } = useParams();

  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    section: "",
    row: "",
    quantity: 1,
  });

  const fetchAvailability = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
            `${API_URL}/events/${id}/availability`
            );
            setAvailability(res.data);
        } catch (error) {
            console.error("Failed to load availability", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, [id]);
  // Rows based on selected section
  const availableRows = useMemo(() => {
    return (
      availability.find((s) => s.name === form.section)?.rows || []
    );
  }, [availability, form.section]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
    const maxSeats = useMemo(() => {
    return (
        availableRows.find((r) => r.name === form.row)
        ?.availableSeats || 1
    );
    }, [availableRows, form.row]);
  const handleSubmit = async () => {
    setMessage("");
    try {
        const res = await axios.post(
            `${API_URL}/events/${id}/purchase`,
            {
            ...form,
            quantity: Number(form.quantity),
            }
        );

        setMessage(
            res.data.data.groupDiscount
            ? "Booked! Group discount applied"
            : "Booked successfully"
        );
        setForm({
            section: "",
            row: "",
            quantity: 1,
        });
        fetchAvailability();


    } catch (err) {
        setMessage(err.response?.data?.message || "Booking failed");
    }
  };

  if (loading) {
    return <p className="text-center mt-4">Loading availability...</p>;
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Availability</h3>

      <ul className="list-group mb-4">
        {availability.map((sec) => (
          <li className="list-group-item" key={sec.name}>
            <strong>{sec.name}</strong>
            <ul className="mt-2">
              {sec.rows.map((row) => (
                <li key={row.name}>
                  {row.name}: {row.availableSeats} seats
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h4>Book Tickets</h4>
      {message && (
        <div className="alert alert-info mt-3">{message}</div>
      )}
      {/* Section */}
      <select
        className="form-select mb-2"
        name="section"
        value={form.section}
        onChange={handleChange}
      >
        <option value="">Select Section</option>
        {availability.map((s) => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Row */}
      <select
        className="form-select mb-2"
        name="row"
        value={form.row}
        onChange={handleChange}
        disabled={!form.section}
      >
        <option value="">Select Row</option>
        {availableRows.map((r) => (
          <option key={r.name} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>

      {/* Quantity */}
      
        <input
        type="number"
        className="form-control mb-3"
        name="quantity"
        min="1"
        max={maxSeats}
        value={form.quantity}
        onChange={handleChange}
        />
      <button
        className="btn btn-success"
        disabled={!form.section || !form.row || !form.quantity}
        onClick={handleSubmit}
      >
        Buy Tickets
      </button>

     
    </div>
  );
}
