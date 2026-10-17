
import { useState } from "react";
import events from "../data/events";
import EventCard from "../components/EventCard";

function Events({ onBook }) {
  const [search, setSearch] = useState("");

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="hero">
        <h1>Find your next experience.</h1>
        <p>Concerts, sports, and unforgettable live events.</p>

        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <main className="main-content">
        <div className="section-heading">
          <h2>Upcoming Events</h2>
          <span>{filteredEvents.length} events</span>
        </div>

        <div className="event-grid">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onBook={onBook}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <p className="empty-message">No events found.</p>
        )}
      </main>
    </>
  );
}

export default Events;
