/**
 * src/services/authLogout.js
 * ---------------------------------------------------------
 * Handles only logout — no API call needed with plain JSON Server.
 * Session lives entirely in localStorage on the client.
 *
 * Usage:
 *   import { logoutUser } from "../services/authLogout";
 */

/**
 * Logout the current user.
 * Clears the session from localStorage.
 */
export function logoutUser() {
  localStorage.removeItem("auth_user");
}