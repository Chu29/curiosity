const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("curiosity_access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const guestRaw = localStorage.getItem("curiosity_guest_session");
    if (guestRaw) {
      try {
        const parsed = JSON.parse(guestRaw);
        if (parsed?.guestToken) {
          headers["x-guest-token"] = parsed.guestToken;
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  return headers;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const authHeaders = getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `API error ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data.message || data.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}
