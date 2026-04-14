/**
 * src/services/authLogin.js
 * ---------------------------------------------------------
 * Handles only the login API call.
 * Uses plain JSON Server — no custom server needed.
 *
 * Usage:
 *   import { loginUser } from "../services/authLogin";
 */

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

/**
 * Login a user.
 * Queries db.json via GET /users?email=X&password=Y
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} user object (id, name, email, role, …)
 * @throws  Error with a human-readable message on failure
 */
export async function loginUser(email, password) {
  try {
    const { data } = await api.get("/users", {
      params: { email, password },
    });

    if (!data || data.length === 0) {
      throw new Error("Invalid email or password.");
    }

    // Strip the password field before storing/returning the user
    const { password: _omit, ...safeUser } = data[0];
    return safeUser;
  } catch (err) {
    const message =
      err.response?.data?.error ||
      err.message ||
      "Login failed. Please check your credentials and try again.";
    throw new Error(message);
  }
}