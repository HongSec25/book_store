const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

/** Thin fetch wrapper: prefixes the API origin (client and server are
 * different origins, unlike Next's same-origin API routes), always sends
 * cookies for the session, and throws on non-OK responses so React Query's
 * error state picks it up naturally. */
export async function apiFetch(path, options = {}) {
  // FormData sets its own multipart boundary Content-Type — never override
  // it with JSON, or file uploads (book covers) silently break.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return body;
}

export { API_BASE_URL };
