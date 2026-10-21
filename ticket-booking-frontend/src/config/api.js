/**
 * API Configuration
 *
 * In browser-side code, we must NEVER use Docker-internal network hostnames
 * like `http://inventory:4001` because requests originate from the user's
 * browser running outside the Docker network.
 *
 * Defaults:
 * - Empty string ("") uses same-origin relative URLs (e.g., `/api/...`),
 *   which are seamlessly reverse-proxied by Nginx in production or Vite dev proxy in development.
 * - Or a browser-accessible URL like `http://localhost:4001` via VITE_API_URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
