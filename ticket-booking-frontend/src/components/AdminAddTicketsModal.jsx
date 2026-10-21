import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { adminSetInventory, adminDeleteInventory } from "../services/api";
import "./AdminAddTicketsModal.css";

const CATEGORY_ICONS = {
  Concert: "🎵",
  Cricket: "🏏",
  Sports: "⚽",
  Comedy: "🎭",
  Festival: "🎪",
  Theatre: "🎬",
  Conference: "🎤",
};

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function AdminAddTicketsModal({
  isOpen,
  onClose,
  onInventoryUpdated,
  existingEvents = [],
  initialEvent = null,
}) {
  const { token, isAdmin } = useAuth();

  const [name, setName] = useState(() => initialEvent?.name || "");
  const [eventId, setEventId] = useState(() => initialEvent?.id || initialEvent?.eventId || "");
  const [isManualId, setIsManualId] = useState(() => Boolean(initialEvent));
  const [quantity, setQuantity] = useState(() => initialEvent?.available ?? 100);
  const [category, setCategory] = useState(() => initialEvent?.category || "Concert");
  const [date, setDate] = useState(() => initialEvent?.date || "");
  const [location, setLocation] = useState(() => initialEvent?.location || "");
  const [price, setPrice] = useState(() => initialEvent?.price ?? 1499);
  const [type, setType] = useState(() => initialEvent?.type || "General & VIP Admission");

  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isAdmin) {
    return null;
  }

  function handleNameChange(e) {
    const newName = e.target.value;
    setName(newName);
    if (!isManualId) {
      setEventId(slugify(newName));
    }
    setError("");
  }

  function handleIdChange(e) {
    const rawVal = e.target.value;
    setIsManualId(true);
    setEventId(rawVal.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
    setError("");
  }

  function handleSelectExistingEvent(event) {
    setEventId(event.id || event.eventId);
    setName(event.name || "");
    setCategory(event.category || "Concert");
    setDate(event.date || "");
    setLocation(event.location || "");
    setPrice(event.price ?? 1499);
    setType(event.type || "General & VIP Admission");
    setQuantity(event.available || 100);
    setIsManualId(true);
    setError("");
  }

  function handleResetForm() {
    setEventId("");
    setName("");
    setQuantity(100);
    setCategory("Concert");
    setDate("");
    setLocation("");
    setPrice(1499);
    setType("General & VIP Admission");
    setIsManualId(false);
    setError("");
  }

  async function handleDelete() {
    const targetId = slugify(eventId);
    if (!targetId) {
      setError("Please select or enter an event ID to delete.");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete event #${targetId} from Redis inventory?`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    try {
      await adminDeleteInventory({ eventId: targetId, token });
      if (onInventoryUpdated) {
        onInventoryUpdated(targetId, 0, "deleted");
      }
      handleResetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete event inventory.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Calculate final safe Event ID
    let finalEventId = slugify(eventId);
    if (!finalEventId && name.trim()) {
      finalEventId = slugify(name);
    }
    if (!finalEventId) {
      finalEventId = `event-${Date.now().toString(36)}`;
    }

    const numQuantity = Number(quantity);
    if (!Number.isSafeInteger(numQuantity) || numQuantity < 0) {
      setError("Quantity must be a non-negative integer (e.g. 50, 100).");
      return;
    }

    const icon = CATEGORY_ICONS[category] || "🎟️";

    setLoading(true);
    try {
      await adminSetInventory({
        eventId: finalEventId,
        quantity: numQuantity,
        metadata: {
          name: name.trim() || finalEventId,
          category,
          icon,
          date: date.trim() || "Upcoming",
          location: location.trim() || "Venue TBA",
          price: Number(price) >= 0 ? Number(price) : 0,
          type: type.trim() || "General Admission",
        },
        token,
      });

      if (onInventoryUpdated) {
        onInventoryUpdated(finalEventId, numQuantity, "saved");
      }

      handleResetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add tickets to backend inventory.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button
          type="button"
          className="admin-close-btn"
          onClick={onClose}
          aria-label="Close admin modal"
        >
          &times;
        </button>

        <div className="admin-modal-header">
          <div className="admin-badge">Admin Controls</div>
          <h2 className="admin-modal-title">Add & Manage Ticket Inventory</h2>
          <p className="admin-modal-subtitle">
            Initialize or update event ticket inventory stored directly in the backend Redis cache.
          </p>
        </div>

        {existingEvents.length > 0 && (
          <div className="quick-select-section">
            <div className="quick-select-header">
              <small>Existing live events:</small>
              <button
                type="button"
                className="new-event-btn"
                onClick={handleResetForm}
              >
                + Create New Event
              </button>
            </div>
            <div className="quick-event-chips">
              {existingEvents.map((ev) => (
                <button
                  type="button"
                  key={ev.id || ev.eventId}
                  className={`quick-chip ${eventId === (ev.id || ev.eventId) ? "selected" : ""}`}
                  onClick={() => handleSelectExistingEvent(ev)}
                >
                  #{ev.id || ev.eventId} ({ev.available} left)
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="admin-error-banner" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-field">
            <label htmlFor="admin-name">Event Title *</label>
            <input
              id="admin-name"
              type="text"
              placeholder="e.g. Arijit Singh Live, Premier League Match"
              value={name}
              onChange={handleNameChange}
              required
              autoFocus
            />
          </div>

          <div className="form-row two-cols">
            <div className="admin-field">
              <label htmlFor="admin-event-id">
                Event ID <span className="label-sub">(auto-generated)</span>
              </label>
              <input
                id="admin-event-id"
                type="text"
                placeholder="e.g. arijit-singh-live"
                value={eventId}
                onChange={handleIdChange}
              />
              <span className="field-hint">Redis key identifier: inventory:<strong>{eventId || "id"}</strong></span>
            </div>

            <div className="admin-field">
              <label htmlFor="admin-quantity">Total Tickets to Add *</label>
              <input
                id="admin-quantity"
                type="number"
                min="0"
                max="100000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <span className="field-hint">Real-time inventory count</span>
            </div>
          </div>

          <div className="form-row two-cols">
            <div className="admin-field">
              <label htmlFor="admin-category">Category</label>
              <select
                id="admin-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Concert">🎵 Concert</option>
                <option value="Cricket">🏏 Cricket</option>
                <option value="Sports">⚽ Sports</option>
                <option value="Comedy">🎭 Standup Comedy</option>
                <option value="Festival">🎪 Music Festival</option>
                <option value="Theatre">🎬 Theatre</option>
                <option value="Conference">🎤 Conference</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="admin-price">Ticket Price (₹)</label>
              <input
                id="admin-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row two-cols">
            <div className="admin-field">
              <label htmlFor="admin-date">Date & Time</label>
              <input
                id="admin-date"
                type="text"
                placeholder="e.g. 25 Nov 2026, 7:00 PM"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-location">Venue / Location</label>
              <input
                id="admin-location"
                type="text"
                placeholder="e.g. Stadium, City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="admin-type">Pass / Admission Type</label>
            <input
              id="admin-type"
              type="text"
              placeholder="e.g. General Admission, VIP Lounge"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>

          <div className="admin-actions">
            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loading || isDeleting}
            >
              {loading ? "Publishing to Redis..." : "Save & Publish Tickets"}
            </button>

            {eventId && (
              <button
                type="button"
                className="admin-delete-btn"
                onClick={handleDelete}
                disabled={loading || isDeleting}
                title="Remove this event completely from Redis inventory"
              >
                {isDeleting ? "Deleting..." : "Delete Event"}
              </button>
            )}

            <button
              type="button"
              className="admin-cancel-btn"
              onClick={onClose}
              disabled={loading || isDeleting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAddTicketsModal;
