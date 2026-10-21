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
              // Gracefully keep mock count if inventory endpoint is not yet initialized
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
    event.name.toLowerCase().includes(search.toLowerCase()) ||
    event.location.toLowerCase().includes(search.toLowerCase()) ||
    event.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="hero">
        <div className="hero-content">
          <span className="hero-kicker">Live Entertainment</span>
          <h1 className="hero-title">Find your next experience.</h1>
          <p className="hero-subtitle">
            Concerts, sports matches, and comedy tours with guaranteed instant ticket confirmation.
          </p>

          <div className="hero-search-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by event, artist, city, or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="section-heading">
          <div>
            <h2>Upcoming Events</h2>
            <span className="section-subtitle">Real-time inventory available</span>
          </div>
          <span className="count-pill">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
          </span>
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
          <div className="empty-search-state">
            <p className="empty-message">No events found matching "{search}".</p>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setSearch("")}
            >
              Clear Search
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default Events;
