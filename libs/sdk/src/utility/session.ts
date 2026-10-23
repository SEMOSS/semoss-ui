/** Session state shared by the public HTTP helpers and typed API routes. */
const cookies = new Map<string, string>();
let generation = 0;

interface CsrfState {
	isEnabled: boolean;
	token: string;
	cookie: string;
}

/**
 * The existing mutable CSRF facade. Cookie tracking is used only in headless
 * mode; assigning `cookie` replaces the manually managed cookie jar.
 */
export const CSRF: CsrfState = {
	isEnabled: false,
	token: "",
	get cookie(): string {
		return Array.from(cookies, ([name, value]) => `${name}=${value}`).join(
			"; ",
		);
	},
	set cookie(value: string) {
		cookies.clear();
		for (const pair of value.split(";")) {
			const separator = pair.indexOf("=");
			if (separator > 0) {
				cookies.set(
					pair.slice(0, separator).trim(),
					pair.slice(separator + 1).trim(),
				);
			}
		}
	},
};

/** Forget credentials issued by the server without changing CSRF configuration. */
export const clearSession = (): void => {
	generation += 1;
	CSRF.token = "";
	cookies.clear();
};

/** Identify the session a request belongs to, so late responses cannot restore it. */
export const getSessionGeneration = (): number => generation;

/**
 * Remember refreshed tokens and merge headless cookies from the current session.
 * @param response - The response carrying session headers.
 * @param requestGeneration - The session in which the request started.
 * @param headless - Whether the caller opted into manual cookie management.
 */
export const rememberSession = (
	response: Response,
	requestGeneration: number,
	headless: boolean,
): void => {
	if (requestGeneration !== generation) {
		return;
	}
	if (headless) {
		for (const cookie of response.headers.getSetCookie?.() ?? []) {
			const [pair, ...attributes] = cookie.split(";");
			const separator = pair.indexOf("=");
			if (separator <= 0) {
				continue;
			}
			const name = pair.slice(0, separator).trim();
			const value = pair.slice(separator + 1).trim();
			const expired = attributes.some((attribute) => {
				const [key, ...parts] = attribute.trim().split("=");
				const contents = parts.join("=");
				return (
					(key.toLowerCase() === "max-age" &&
						Number(contents) <= 0) ||
					(key.toLowerCase() === "expires" &&
						Date.parse(contents) <= Date.now())
				);
			});
			if (expired || !value) {
				cookies.delete(name);
			} else {
				cookies.set(name, value);
			}
		}
	}
	const token = response.headers.get("X-CSRF-Token");
	if (token && token.toLowerCase() !== "required") {
		CSRF.token = token;
	}
};
