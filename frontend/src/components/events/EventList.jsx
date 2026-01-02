import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const EVENTS_PER_PAGE = 9;
export default function Home() {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  

  const fetchData = async (page) => {
    try {
      const res = await axios.get(
        `${API_URL}/events?page=${page}&limit=${EVENTS_PER_PAGE}`
      );

      if (res.status === 200 && res.data.success) {
        setEvents(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col text-center">
          <h2 className="fw-bold">Events</h2>
        </div>
      </div>

      {events.length === 0 && (
        <div className="row">
          <div className="col text-center">
            <p className="text-muted">No events available</p>
          </div>
        </div>
      )}

      <div className="row">
        {events.map((ev) => (
          <div className="col-md-6 col-lg-4 mb-4" key={ev._id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title fw-semibold">{ev.name}</h5>

                <p className="card-text text-muted mb-4">
                  <i className="bi bi-calendar-event me-2"></i>
                  Date : {new Date(ev.date).toISOString().split("T")[0]}
                </p>

                <Link
                  to={`/event/${ev._id}`}
                  className="btn btn-primary mt-auto"
                >
                  Book Event
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>
            </li>

            {[...Array(totalPages)].map((_, index) => (
              <li
                key={index}
                className={`page-item ${
                  currentPage === index + 1 ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}

            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
