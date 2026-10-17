
function Bookings({ bookings }) {
  return (
    <main className="main-content">
      <div className="section-heading">
        <h2>My Bookings</h2>
        <span>{bookings.length} bookings</span>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-bookings">
          <h3>No bookings yet</h3>
          <p>Book an event to see it here.</p>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <div className="booking-card" key={booking.bookingId}>
              <div>
                <h3>{booking.event.name}</h3>
                <p>{booking.event.date}</p>
                <p>{booking.event.location}</p>
                <p>Booking ID: {booking.bookingId}</p>
              </div>

              <div className="booking-card-right">
                <span className="booking-status">
                  {booking.status}
                </span>

                <h3>
                  ₹{booking.event.price.toLocaleString("en-IN")}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Bookings;
