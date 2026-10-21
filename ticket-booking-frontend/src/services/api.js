import { API_BASE_URL } from "../config/api";

/**
 * Fetch current ticket inventory for a given event ID.
 * @param {string|number} eventId
 * @returns {Promise<{ eventId: string, available: number }>}
 */
export async function fetchInventory(eventId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/inventory`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Log in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ message: string, token: string, user: { id: string, email: string, role: string } }>}
 */
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Login failed: HTTP ${response.status}`);
  }

  return data;
}

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ message: string, user: { id: string, email: string, role: string } }>}
 */
export async function registerUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Registration failed: HTTP ${response.status}`);
  }

  return data;
}

/**
 * Fetch the currently authenticated user's profile.
 * @param {string} token
 * @returns {Promise<{ user: { id: string, email: string, role: string } }>}
 */
export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch profile: HTTP ${response.status}`);
  }

  return data;
}

/**
 * Reserve tickets for an event.
 * @param {Object} params
 * @param {string|number} params.eventId
 * @param {number} params.quantity
 * @param {string} params.token
 * @param {string} params.idempotencyKey
 */
export async function reserveTickets({ eventId, quantity, token, idempotencyKey }) {
  const response = await fetch(`${API_BASE_URL}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ eventId: String(eventId), quantity: Number(quantity) }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Reservation failed: HTTP ${response.status}`);
  }

  return data;
}

/**
 * Confirm an existing ticket reservation.
 * @param {string} reservationId
 * @param {string} token
 */
export async function confirmReservation(reservationId, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/reservations/${reservationId}/confirm`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Confirmation failed: HTTP ${response.status}`);
  }

  return data;
}
