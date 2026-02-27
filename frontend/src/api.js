const BASE = "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getMatches(page = 1, perPage = 20) {
  return request(`/matches?page=${page}&per_page=${perPage}`);
}

export function getMatch(id) {
  return request(`/matches/${id}`);
}

export function flagMatch(id) {
  return request(`/matches/${id}/flag`, { method: "POST" });
}

export function sendMessage(id, body) {
  return request(`/matches/${id}/message`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function getFollowUps() {
  return request("/followups");
}

export function removeFollowUp(id) {
  return request(`/followups/${id}`, { method: "DELETE" });
}

export function syncMatches() {
  return request("/sync", { method: "POST" });
}

export function getSyncStatus() {
  return request("/sync/status");
}
