import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import AuthModal from "./components/AuthModal";
import Events from "./pages/Events";
import Bookings from "./pages/Bookings";
import { reserveTickets, confirmReservation } from "./services/api";
import "./App.css";

const STORAGE_BOOKINGS_KEY = "ticket_bookings_history";

function AppContent() {
  const { user, isAuthenticated, logout, openAuthModal, token } = useAuth();
  const location = useLocation();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const userEmail = user?.email || "";
  const userInitial = (userEmail ? userEmail[0] : (user?.role ? user.role[0] : "U")).toUpperCase();
  const userDisplay = userEmail || (user?.id ? `User #${user.id.slice(0, 6)}` : "My Account");

  const [bookings, setBookings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BOOKINGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync bookings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch {
      // Ignore storage errors
    }
  }, [bookings]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  }

  function handleOpenBooking(event) {
    setSelectedEvent(event);
    setTicketQuantity(1);
    setBookingError("");

    if (!isAuthenticated) {
      openAuthModal("Please sign in or register to complete your ticket booking.");
    }
  }

  async function handleConfirmBooking() {
    if (!isAuthenticated) {
      openAuthModal("Please sign in first to confirm this reservation.");
      return;
    }

    setIsBookingSubmitting(true);
    setBookingError("");

    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // 1. Reserve tickets with backend
      const reserveData = await reserveTickets({
        eventId: selectedEvent.id,
        quantity: ticketQuantity,
        token,
        idempotencyKey,
      });

      const reservationId =
        reserveData?.reservation?.id ||
        reserveData?.reservationId ||
        `res-${Date.now()}`;

      // 2. Confirm reservation with backend
      await confirmReservation(reservationId, token);

      // 3. Save confirmed booking
      const newBooking = {
        bookingId: reservationId,
        event: selectedEvent,
        quantity: ticketQuantity,
        totalPrice: selectedEvent.price * ticketQuantity,
        status: "CONFIRMED",
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      setSelectedEvent(null);
      showToast(`🎉 Booking confirmed! Reservation ID: ${reservationId.substring(0, 8)}...`);
    } catch (err) {
      setBookingError(err.message || "Failed to confirm reservation with backend.");
    } finally {
      setIsBookingSubmitting(false);
    }
  }

  function handleDemoFallbackBooking() {
    const fallbackId = `demo-${Date.now()}`;
    const newBooking = {
      bookingId: fallbackId,
      event: selectedEvent,
      quantity: ticketQuantity,
      totalPrice: selectedEvent.price * ticketQuantity,
      status: "CONFIRMED (DEMO)",
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setSelectedEvent(null);
    showToast("🎉 Booking saved in demo mode!");
  }

  return (
    <div className="app-container">
      <AuthModal />

      {toastMessage && (
        <div className="toast-notification" role="status">
          <span>{toastMessage}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToastMessage("")}
          >
            &times;
          </button>
        </div>
      )}

      {/* Minimal White Navigation */}
      <nav className="navbar">
        <Link to="/" className="brand" aria-label="TicketHub Home">
          <div className="brand-logo">🎟️</div>
          <h2>TicketHub</h2>
        </Link>

        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            Events
          </Link>
          <Link
            to="/bookings"
            className={`nav-link ${location.pathname === "/bookings" ? "active" : ""}`}
          >
            My Bookings
            {bookings.length > 0 && (
              <span className="nav-badge">{bookings.length}</span>
            )}
          </Link>

          <div className="nav-auth-section">
            {isAuthenticated ? (
              <div className="user-profile-menu">
                <div className="user-chip" title={userDisplay}>
                  <span className="user-avatar-circle">
                    {userInitial}
                  </span>
                  <span className="user-email-text">{userDisplay}</span>
                </div>
                <button
                  type="button"
                  className="sign-out-btn"
                  onClick={logout}
                  aria-label="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="sign-in-btn"
                onClick={() => openAuthModal()}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Events onBook={handleOpenBooking} />} />
        <Route path="/bookings" element={<Bookings bookings={bookings} />} />
      </Routes>

      {/* Booking Confirmation Modal */}
      {selectedEvent && (
        <div className="booking-modal" onClick={() => setSelectedEvent(null)}>
          <div
            className="booking-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
          >
            <button
              className="close-button"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close modal"
            >
              &times;
            </button>

            <div className="booking-modal-header">
              <span className="booking-modal-kicker">{selectedEvent.category}</span>
              <h2 id="booking-modal-title">Confirm Ticket Reservation</h2>
            </div>

            <div className="booking-summary-card">
              <h3 className="event-name-display">{selectedEvent.name}</h3>
              <div className="summary-meta-grid">
                <div>
                  <small>Date</small>
                  <p>📅 {selectedEvent.date}</p>
                </div>
                <div>
                  <small>Location</small>
                  <p>📍 {selectedEvent.location}</p>
                </div>
                <div>
                  <small>Price per ticket</small>
                  <p>₹{selectedEvent.price.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <small>Availability</small>
                  <p>{selectedEvent.available} available</p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="quantity-control-row">
                <label htmlFor="ticket-quantity">Tickets Quantity:</label>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                    disabled={ticketQuantity <= 1 || isBookingSubmitting}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="quantity-value">{ticketQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setTicketQuantity((q) => Math.min(10, q + 1))}
                    disabled={ticketQuantity >= 10 || isBookingSubmitting}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="booking-price-summary">
                <span>Total Amount:</span>
                <strong className="total-amount">
                  ₹{(selectedEvent.price * ticketQuantity).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Error Display */}
            {bookingError && (
              <div className="booking-error-alert" role="alert">
                <p>⚠️ <strong>Backend Error:</strong> {bookingError}</p>
                {bookingError.toLowerCase().includes("not been initialized") && (
                  <p className="error-tip">
                    Note: Backend inventory must be initialized by admin via <code>PUT /api/admin/events/{selectedEvent.id}/inventory</code>.
                  </p>
                )}
                <button
                  type="button"
                  className="fallback-confirm-btn"
                  onClick={handleDemoFallbackBooking}
                >
                  Confirm in Demo Mode
                </button>
              </div>
            )}

            {/* Actions */}
            {!isAuthenticated ? (
              <div className="modal-auth-prompt">
                <p>You need to sign in to confirm this reservation with the backend service.</p>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={() => openAuthModal("Sign in to confirm your ticket reservation.")}
                >
                  Sign In to Reserve
                </button>
              </div>
            ) : (
              <div className="modal-actions">
                <div className="user-order-tag">
                  Reserving for: <strong>{userDisplay}</strong>
                </div>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleConfirmBooking}
                  disabled={isBookingSubmitting}
                >
                  {isBookingSubmitting ? "Reserving Tickets..." : "Confirm & Pay"}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setSelectedEvent(null)}
                  disabled={isBookingSubmitting}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
