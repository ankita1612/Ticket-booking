import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/events`);
        if(res.status==200 && res.data.success==true)
        {
            setEvents(res.data.data);
        }       
        
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Events</h2>

      {events.length === 0 && (
        <p className="text-muted">No events available</p>
      )}

      {events.map((ev) => (
        <div className="card mb-3" key={ev._id}>
          <div className="card-body">
            <h5 className="card-title">{ev.name}</h5>
            <p className="card-text">
              {new Date(ev.date).toLocaleString()}
            </p>
            <Link to={`/event/${ev._id}`} className="btn btn-primary">
              View / Book
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
