
import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Events from "./pages/Events";
import Bookings from "./pages/Bookings";
import "./App.css";

function App() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);

  function confirmBooking() {
    const booking = {
      bookingId: Date.now(),
      event: selectedEvent,
      status: "CONFIRMED",
    };

    setBookings((previous) => [...previous, booking]);
    setSelectedEvent(null);
    window.alert("Booking confirmed successfully!");
  }

  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="brand">
          <h2>TicketHub</h2>
        </Link>

        <div className="nav-links">
          <Link to="/">Events</Link>
          <Link to="/bookings">My Bookings ({bookings.length})</Link>
          <button onClick={() => window.alert("Login coming later.")}>
            Login
          </button>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<Events onBook={setSelectedEvent} />}
        />

        <Route
          path="/bookings"
          element={<Bookings bookings={bookings} />}
        />
      </Routes>

      {selectedEvent && (
        <div
          className="booking-modal"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="booking-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelectedEvent(null)}
            >
              &times;
            </button>

            <h2>Confirm Your Booking</h2>
            <h3>{selectedEvent.name}</h3>
            <p>Date: {selectedEvent.date}</p>
            <p>Location: {selectedEvent.location}</p>
            <p>
              Price: ₹{selectedEvent.price.toLocaleString("en-IN")}
            </p>

            <button
              className="confirm-button"
              onClick={confirmBooking}
            >
              Confirm Booking
            </button>

            <button
              className="cancel-button"
              onClick={() => setSelectedEvent(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
