
import "./EventCard.css";

function EventCard({ event, onBook }) {
  return (
    <div className="event-card">
      <img src={event.image} alt={event.name} />

      <div className="event-info">
        <span className="event-category">{event.category}</span>

        <h3>{event.name}</h3>

        <p>📅 {event.date}</p>
        <p>📍 {event.location}</p>

        <div className="event-bottom">
          <div>
            <h3>₹{event.price.toLocaleString("en-IN")}</h3>
            <small>{event.available} tickets left</small>
          </div>

          <button onClick={() => onBook(event)}>
            Book Tickets
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
