import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Bookings({ bookings }) {
  const { isAuthenticated, user, openAuthModal } = useAuth();

  return (
    <main className="main-content">
      <div className="section-heading">
        <div>
          <h2>My Bookings</h2>
          {isAuthenticated && (
            <span className="user-email-subtitle">
              Logged in as {user?.email || (user?.id ? `User #${user.id.slice(0, 6)}` : "My Account")}
            </span>
          )}
        </div>
        <span className="count-pill">{bookings.length} {bookings.length === 1 ? "booking" : "bookings"}</span>
      </div>

      {!isAuthenticated && (
        <div className="auth-prompt-card">
          <div className="auth-prompt-icon">🔐</div>
          <h3>Sign in to manage your tickets</h3>
          <p>Sign in with your account to access your confirmed reservations across devices.</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => openAuthModal("Sign in to see your confirmed bookings.")}
          >
            Sign In
          </button>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="empty-bookings">
          <div className="empty-icon">🎟️</div>
          <h3>No bookings yet</h3>
          <p>You haven't reserved any tickets yet. Explore upcoming events to get started.</p>
          <Link to="/" className="browse-events-btn">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => {
            const quantity = booking.quantity || 1;
            const totalPrice = booking.totalPrice || (booking.event.price * quantity);

            return (
              <div className="booking-card" key={booking.bookingId || booking.reservationId}>
                <div className="booking-card-left">
                  <div className="booking-card-header">
                    <span className="booking-category">{booking.event.category}</span>
                    <span className="booking-id-tag">ID: {booking.bookingId || booking.reservationId}</span>
                  </div>

                  <h3 className="booking-event-name">{booking.event.name}</h3>

                  <div className="booking-meta">
                    <p>📅 {booking.event.date}</p>
                    <p>📍 {booking.event.location}</p>
                    <p>🎟️ {quantity} {quantity === 1 ? "ticket" : "tickets"}</p>
                  </div>
                </div>

                <div className="booking-card-right">
                  <span className="booking-status">
                    {booking.status || "CONFIRMED"}
                  </span>

                  <div className="booking-price-block">
                    <small>Total Paid</small>
                    <h3>₹{totalPrice.toLocaleString("en-IN")}</h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Bookings;
