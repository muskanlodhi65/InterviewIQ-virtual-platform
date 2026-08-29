/**
 * api/client.js
 * ---------------
 * Thin axios wrapper: injects the stored JWT into every request and
 * centralizes the base URL. Uses the Vite dev proxy ("/api" -> backend)
 * so the frontend never needs to know the backend's actual host/port.
 */

import axios from "axios";

const client = axios.create({
  baseURL: "/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("interviewiq_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  localStorage.setItem("interviewiq_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("interviewiq_token");
}

export function getAuthToken() {
  return localStorage.getItem("interviewiq_token");
}

// --- Auth ---
export const signup = (name, email, password, role = "candidate") =>
  client.post("/auth/signup", { name, email, password, role }).then((r) => r.data);

export const login = (email, password) =>
  client.post("/auth/login", { email, password }).then((r) => r.data);

export const getMe = () => client.get("/auth/me").then((r) => r.data);

// --- Questions ---
export const getRoles = () => client.get("/questions/roles").then((r) => r.data);

// --- Sessions ---
export const createSession = (role, numQuestions) =>
  client.post("/sessions", { role, num_questions: numQuestions }).then((r) => r.data);

export const submitAnswer = (sessionId, payload) =>
  client.post(`/sessions/${sessionId}/answers`, payload).then((r) => r.data);

export const getSessionResult = (sessionId) =>
  client.get(`/sessions/${sessionId}`).then((r) => r.data);

export const getSessionHistory = () => client.get("/sessions").then((r) => r.data);

export default client;
