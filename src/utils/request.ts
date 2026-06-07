import { projectId, publicAnonKey } from "./supabase/info";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions<T> {
  path: string; // e.g., "/signin"
  method?: HttpMethod;
  body?: T;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

interface JsonResponse<T> {
  response: Response;
  data: T;
}

const base = `https://${projectId}.supabase.co/functions/v1/make-server-98b21042`;

export async function requestJson<TReq = any, TRes = any>(opts: RequestOptions<TReq>): Promise<JsonResponse<TRes>> {
  const { path, method = "GET", body, headers = {}, timeoutMs = 15000 } = opts;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const commonInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  };

  try {
    // 1) Normal path (preferred)
    let res = await fetch(`${base}${path}`, commonInit);
    if (res.ok) {
      const data = (await res.json()) as TRes;
      return { response: res, data };
    }

    // Retry legacy path only when route is actually missing.
    if (res.status !== 404 && res.status !== 405) {
      const contentType = res.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: `Server returned non-JSON response: ${res.status} ${res.statusText}`, details: text.substring(0, 200) };
      }
      return { response: res, data };
    }

    // 2) Fallback: handle legacy routes that included function name inside the function
    // e.g., /functions/v1/make-server-98b21042/make-server-98b21042/signin
    res = await fetch(`${base}/make-server-98b21042${path}`, commonInit);
    
    // Handle non-JSON responses (HTML error pages, etc.)
    const contentType = res.headers.get('content-type');
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: `Server returned non-JSON response: ${res.status} ${res.statusText}`, details: text.substring(0, 200) };
    }
    return { response: res, data };
  } finally {
    clearTimeout(timer);
  }
}
