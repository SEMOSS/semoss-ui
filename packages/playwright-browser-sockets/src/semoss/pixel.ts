import { Env } from "@semoss/sdk";

export function getModulePath(): string {
  return Env.MODULE || process.env.MODULE || "/Monolith";
}

export type PixelReturn<T = unknown> = {
  insightID?: string;
  pixelReturn?: Array<{
    output?: T;
    operationType?: unknown;
  }>;
};

export function assertPixelSuccess(
  response: PixelReturn<unknown>,
  operation: string,
): void {
  const errors = response.pixelReturn
    ?.filter((item) => String(item.operationType || "").includes("ERROR"))
    .map((item) =>
      typeof item.output === "string"
        ? item.output
        : JSON.stringify(item.output),
    );
  if (errors?.length) {
    throw new Error(`${operation} failed: ${errors.join("\n")}`);
  }
}

let csrfToken = "";

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${getModulePath()}/api/config/fetchCsrf`, {
    credentials: "include",
    headers: {
      "X-CSRF-Token": "fetch",
    },
  });

  csrfToken =
    response.headers.get("X-CSRF-Token") ||
    response.headers.get("x-csrf-token") ||
    "";
  return csrfToken;
}

export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (method !== "GET" && method !== "HEAD" && !headers.has("X-CSRF-Token")) {
    const token = await getCsrfToken();
    if (token) {
      headers.set("X-CSRF-Token", token);
    }
  }

  return fetch(input, {
    credentials: "include",
    ...init,
    headers,
  });
}

export async function runPixel<T = unknown>(
  expression: string,
  insightId?: string,
): Promise<PixelReturn<T>> {
  const body = new URLSearchParams();
  body.set("expression", expression);
  if (insightId) {
    body.set("insightId", insightId);
  }
  body.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  const response = await fetchWithCsrf(`${getModulePath()}/api/engine/runPixel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(errorText || `Pixel request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as PixelReturn<T>;
}
