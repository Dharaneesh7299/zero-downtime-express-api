import "./EventCard.css";

function EventCard({ event, onBook }) {
  const isSoldOut = typeof event.available === "number" && event.available <= 0;

  return (
    <div className={`event-card ${isSoldOut ? "sold-out" : ""}`}>
      <div className="event-image-wrap">
        <img src={event.image} alt={event.name} loading="lazy" />
        <span className="event-badge">{event.category}</span>
      </div>

      <div className="event-info">
        <h3 className="event-title">{event.name}</h3>

        <div className="event-meta">
          <p className="event-meta-item">
            <span className="meta-icon">📅</span>
            <span>{event.date}</span>
          </p>
          <p className="event-meta-item">
            <span className="meta-icon">📍</span>
            <span>{event.location}</span>
          </p>
        </div>

        <div className="event-bottom">
          <div className="event-pricing">
            <span className="event-price">₹{event.price.toLocaleString("en-IN")}</span>
            <small className="event-availability">
              {isSoldOut ? "Sold Out" : `${event.available} tickets left`}
            </small>
          </div>

          <button
            className="book-btn"
            onClick={() => onBook(event)}
            disabled={isSoldOut}
          >
            {isSoldOut ? "Unavailable" : "Book Tickets"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
