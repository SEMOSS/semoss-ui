import { Env } from "../env";
import { CSRF, get, post } from "../utility";

/**
 * Allow the user to login
 *
 * @param username - username to login with
 * @param password - password to login with
 * @returns true if successful
 */
export const login = async (
	username: string,
	password: string,
): Promise<boolean> => {
	await post(`${Env.MODULE}/api/auth/login`, {
		username: username,
		password: password,
		disableRedirect: true,
	});

	return true;
};

/**
 * Allow the user to login with ldap
 *
 * @param username - username to login with
 * @param password - password to login with
 * @returns true if successful
 */
export const loginLDAP = async (
	username: string,
	password: string,
): Promise<boolean> => {
	// loginLDAP reads username / password, pin is only for linotp
	await post(`${Env.MODULE}/api/auth/loginLDAP`, {
		username: username,
		password: password,
		disableRedirect: true,
	});

	return true;
};

/**
 * Start a linotp login. This does not create a session, the backend replies
 * with a challenge and the user still needs to submit the otp via
 * {@link confirmOTP}.
 *
 * @param username - username to login with
 * @param pin - pin to login with
 * @returns true if the challenge was accepted
 */
export const loginOTP = async (
	username: string,
	pin: string,
): Promise<boolean> => {
	await post(`${Env.MODULE}/api/auth/loginLinOTP`, {
		username: username,
		pin: pin,
		disableRedirect: true,
	});

	return true;
};

/**
 * Confirm the otp of a linotp login started by {@link loginOTP}
 *
 * @param otp - otp to login with
 * @returns true if successful
 */
export const confirmOTP = async (otp: string): Promise<boolean> => {
	await post(`${Env.MODULE}/api/auth/loginLinOTP`, {
		otp: otp,
		disableRedirect: true,
	});

	return true;
};

/**
 * Allow the user to login with outh
 *
 * @param provider - provider to login with
 * @param isPopup - check if in popup
 * @returns true if successful
 */
export const oauth = async (
	provider: string,
	isPopup = false,
): Promise<boolean> => {
	// check if the user is logged in
	const response = await get<{ name?: string }>(
		`${Env.MODULE}/api/auth/userinfo/${provider}`,
	);

	//check if they are already logged in
	if (response.data?.name) {
		return true;
	}

	// if called from the popup, throw an error as the user was unable to login
	if (isPopup) {
		throw new Error("Unable to login");
	}

	return new Promise((resolve, reject) => {
		// only works in browser
		if (
			typeof window === "undefined" ||
			typeof window.top === "undefined"
		) {
			reject("Unable to login");
			return;
		}

		const url = `${Env.MODULE}/api/auth/login/${provider}`;
		const popUpWindow = window.top.open(
			url,
			"_blank",
			"height=600,width=400,top=300,left=" + 600,
		);

		// setup an interval to see if the popup window is closed or successful
		const interval = setInterval(async () => {
			try {
				if (
					!popUpWindow ||
					popUpWindow.closed ||
					popUpWindow.closed === undefined
				) {
					clearInterval(interval);
				} else if (
					popUpWindow.document.location.href.indexOf(
						`${window.location.host}`,
					) > -1
				) {
					clearInterval(interval);

					// close it
					popUpWindow.close();

					// try to get the info again
					const response = await oauth(provider, true);

					// close it
					resolve(response);
				}
			} catch (_err) {
				// do nothing
				// this is to work around the blocked frame error that comes up
			}
		}, 1000);
	});
};

/**
 * Allow the user to logout
 *
 * @returns true if successful
 */
export const logout = async (): Promise<boolean> => {
	// we need to disableRedirect because fetch.ts doesn't allow a 302
	// and even if we bypass the 302 for logout then it requires the payload
	// to always be valid json
	await get(`${Env.MODULE}/api/auth/logout/all?disableRedirect=true`);
	CSRF.token = "";
	return true;
};

/** How often a sign in popup is checked for having closed or come back. */
const POPUP_POLL_MS = 1000;

/**
 * How often the logins are read while a sign in popup is open, for a sign in
 * that finishes on another origin, where the popup cannot be read.
 */
const CONNECT_LOGINS_POLL_MS = 5000;

/** How long a sign in may take before its popup is given up on. */
const CONNECT_TIMEOUT_MS = 5 * 60 * 1000;

const POPUP_FEATURES = "popup,width=520,height=680";

/**
 * Raised when the browser blocks a sign in popup, so the UI can ask the user
 * to allow popups for the site.
 */
export class PopupBlockedError extends Error {
	constructor() {
		super("The sign in window was blocked");
		this.name = "PopupBlockedError";
	}
}

/**
 * Raised when asked to sign out of the login the session belongs to, or when
 * that login is not known: signing it out would end the session or change
 * whose it is.
 */
export class SessionLoginDisconnectError extends Error {
	constructor() {
		super("The account the session signed in with cannot be disconnected");
		this.name = "SessionLoginDisconnectError";
	}
}

/**
 * The logins the session holds: the account name for each, keyed by provider
 * in upper case (`NATIVE`, `MICROSOFT`, `GOOGLE`, ...).
 *
 * @returns The session's logins.
 */
export const getLogins = async (): Promise<Record<string, string>> => {
	const { data } = await get<unknown>(`${Env.MODULE}/api/auth/logins`);
	const logins: Record<string, string> = {};
	if (typeof data !== "object" || data === null) {
		return logins;
	}
	for (const [provider, name] of Object.entries(data)) {
		if (typeof name === "string") {
			logins[provider.toUpperCase()] = name;
		}
	}
	return logins;
};

/**
 * Sign the session out of one provider, keeping its other logins.
 *
 * @param provider - The provider's login key, such as `MICROSOFT`.
 */
export const logoutProvider = async (provider: string): Promise<void> => {
	await get(`${Env.MODULE}/api/auth/logout/${provider}?disableRedirect=true`);
};

/**
 * Whether a popup has come back to this app, which is where the backend sends
 * it once a sign in finishes. A popup still on the provider's pages cannot be
 * read, which counts as not yet.
 *
 * @param popup - The sign in popup.
 * @returns True once the popup shows a page of this app again.
 */
const isPopupBack = (popup: Window): boolean => {
	try {
		const href = popup.location.href;
		return (
			!!href &&
			href !== "about:blank" &&
			new URL(href).origin === window.location.origin &&
			!href.includes("/api/auth/login")
		);
	} catch {
		return false;
	}
};

/**
 * Sign the session in to one more provider, alongside the login it already
 * has, always with a fresh sign in.
 *
 * The backend attaches the provider's token to the current session, and it
 * keeps listing a provider whose token has expired or failed to refresh. So a
 * provider the session already lists is signed out first, and the sign in ends
 * once it is listed again, or when the popup closes or comes back to this app,
 * or after five minutes. The popup is checked every second; the logins are
 * read every few seconds as well, since a sign in that finishes on another
 * origin leaves the popup unreadable.
 *
 * The session's own login is never signed out, since that would end the
 * session or change whose it is; when it is the one being renewed, the sign in
 * ends when the popup closes or comes back to this app. Nothing is signed out
 * either when the session's login is not known.
 *
 * Must be called straight from a click, before any await, or the browser
 * blocks the popup.
 *
 * @param options.provider - The provider's login key, such as `MICROSOFT`.
 * @param options.loginPath - The segment of `/api/auth/login/{segment}` that
 * starts its sign in. Defaults to the login key in lower case.
 * @param options.primaryLogin - The login the session belongs to, or null
 * when it is not known.
 * @returns Whether the session holds the provider's login once the popup is
 * done.
 * @throws PopupBlockedError when the popup could not open.
 */
export const connectLogin = ({
	provider,
	loginPath = provider.toLowerCase(),
	primaryLogin,
}: {
	provider: string;
	loginPath?: string;
	primaryLogin: string | null;
}): Promise<boolean> => {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Signing in needs a browser"));
	}

	// opened blank inside the click, and sent to the sign in once any stale
	// login is gone
	const popup = window.open("", "semoss-connect", POPUP_FEATURES);
	if (!popup) {
		return Promise.reject(new PopupBlockedError());
	}

	const isConnected = async (): Promise<boolean> => {
		try {
			return provider in (await getLogins());
		} catch {
			return false;
		}
	};

	return (async () => {
		const wasConnected = await isConnected();
		const canSignOut =
			wasConnected && primaryLogin !== null && primaryLogin !== provider;
		if (canSignOut) {
			await logoutProvider(provider).catch(() => undefined);
		}
		// a renewed session login stays listed, so only the popup tells when
		// it is done
		const watchesLogins = !wasConnected || canSignOut;
		if (popup.closed) {
			return isConnected();
		}
		popup.location.href = `${Env.MODULE}/api/auth/login/${loginPath}`;

		return new Promise<boolean>((resolve) => {
			const startedAt = Date.now();
			let loginsReadAt = startedAt;
			let isChecking = false;

			const timer = window.setInterval(async () => {
				if (isChecking) {
					return;
				}
				isChecking = true;
				try {
					const now = Date.now();
					const hasEnded = popup.closed || isPopupBack(popup);
					const hasTimedOut = now - startedAt > CONNECT_TIMEOUT_MS;
					let isListed = false;
					if (
						watchesLogins &&
						now - loginsReadAt >= CONNECT_LOGINS_POLL_MS
					) {
						loginsReadAt = now;
						isListed = await isConnected();
					}
					if (!hasEnded && !hasTimedOut && !isListed) {
						return;
					}

					window.clearInterval(timer);
					if (!popup.closed) {
						popup.close();
					}
					resolve(isListed || (await isConnected()));
				} finally {
					isChecking = false;
				}
			}, POPUP_POLL_MS);
		});
	})();
};
