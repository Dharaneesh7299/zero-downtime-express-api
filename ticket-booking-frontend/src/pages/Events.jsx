import { useState, useEffect } from "react";
import initialEvents from "../data/events";
import EventCard from "../components/EventCard";
import { fetchInventory } from "../services/api";

function Events({ onBook }) {
  const [search, setSearch] = useState("");
  const [eventsList, setEventsList] = useState(initialEvents);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveInventories() {
      try {
        const updated = await Promise.all(
          initialEvents.map(async (event) => {
            try {
              const live = await fetchInventory(event.id);
              if (live && typeof live.available === "number") {
                return { ...event, available: live.available };
              }
            } catch {
              // Silently keep mock count if inventory endpoint is not yet initialized
            }
            return event;
          })
        );

        if (isMounted) {
          setEventsList(updated);
        }
      } catch {
        // Fallback to initial events
      }
    }

    loadLiveInventories();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = eventsList.filter((event) =>
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
