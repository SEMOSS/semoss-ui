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
 * How often the login is read while a sign in popup is open, for a sign in
 * that finishes on another origin, where the popup cannot be read.
 */
const SIGN_IN_POLL_MS = 2000;

/** How long a sign in may take before its popup is given up on. */
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;

const POPUP_FEATURES = "popup,width=520,height=680";

/**
 * Where a sign in popup starts. With `disableRedirect` the backend ends the
 * sign in on a small page that closes the popup, instead of redirecting the
 * popup to an app. A backend without the option still redirects, and
 * {@link waitForSignInPopup} closes the popup either way.
 *
 * @param loginPath - The segment of `/api/auth/login/{segment}`, such as `ms`.
 * @returns The URL to open.
 */
const getSignInUrl = (loginPath: string): string =>
	`${Env.MODULE}/api/auth/login/${loginPath}?disableRedirect=true`;

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
 * A login map as the backend sends it, in `/api/auth/logins` and the config's
 * `logins`: the account name for each login, keyed by provider in upper case.
 * Entries without a name are left out.
 *
 * @param value - The backend's login map.
 * @returns The logins; none for anything that is not a map.
 */
export const parseLogins = (value: unknown): Record<string, string> => {
	const logins: Record<string, string> = {};
	if (typeof value !== "object" || value === null) {
		return logins;
	}
	for (const [provider, name] of Object.entries(value)) {
		if (typeof name === "string") {
			logins[provider.toUpperCase()] = name;
		}
	}
	return logins;
};

/**
 * The logins the session holds: the account name for each, keyed by provider
 * in upper case (`NATIVE`, `MICROSOFT`, `GOOGLE`, ...).
 *
 * @returns The session's logins.
 */
export const getLogins = async (): Promise<Record<string, string>> => {
	const { data } = await get<unknown>(`${Env.MODULE}/api/auth/logins`);
	return parseLogins(data);
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
 * Wait for a sign in popup to finish, then close it. It is done once it
 * closes, comes back to this app, or the session shows the login, or after
 * five minutes. The popup is checked every second. The login is read every
 * two seconds while `watchesLogin` is set, since a sign in can finish on
 * another origin, such as the app the backend sends the popup to, where the
 * popup cannot be read.
 *
 * @param popup - The popup showing the sign in.
 * @param isSignedIn - Reads whether the session holds the login. Must not
 * reject.
 * @param watchesLogin - Whether to read the login while the popup is open. A
 * login the session already holds stays held while it is renewed, so only the
 * popup tells when that sign in is done.
 * @returns Whether the session holds the login once the popup is done.
 */
const waitForSignInPopup = (
	popup: Window,
	isSignedIn: () => Promise<boolean>,
	watchesLogin: boolean,
): Promise<boolean> =>
	new Promise<boolean>((resolve) => {
		const startedAt = Date.now();
		let loginReadAt = startedAt;
		let isChecking = false;

		const timer = window.setInterval(async () => {
			if (isChecking) {
				return;
			}
			isChecking = true;
			try {
				const now = Date.now();
				const hasEnded = popup.closed || isPopupBack(popup);
				const hasTimedOut = now - startedAt > SIGN_IN_TIMEOUT_MS;
				let hasLogin = false;
				if (watchesLogin && now - loginReadAt >= SIGN_IN_POLL_MS) {
					loginReadAt = now;
					hasLogin = await isSignedIn();
				}
				if (!hasEnded && !hasTimedOut && !hasLogin) {
					return;
				}

				window.clearInterval(timer);
				if (!popup.closed) {
					popup.close();
				}
				resolve(hasLogin || (await isSignedIn()));
			} finally {
				isChecking = false;
			}
		}, POPUP_POLL_MS);
	});

/**
 * Sign the session in to one more provider, alongside the login it already
 * has, always with a fresh sign in.
 *
 * The backend attaches the provider's token to the current session, and it
 * keeps listing a provider whose token has expired or failed to refresh. So a
 * provider the session already lists is signed out first, and the sign in ends
 * once it is listed again, or when the popup closes or comes back to this app,
 * or after five minutes (see {@link waitForSignInPopup}).
 *
 * The session's own login is never signed out, since that would end the
 * session or change whose it is; when it is the one being renewed, the sign in
 * ends when the popup closes or comes back to this app. Nothing is signed out
 * either when the session's login is not known.
 *
 * Must be called straight from a click, before any await, or the browser
 * blocks the popup.
 *
 * @param options.provider - The provider's login key, such as `MICROSOFT`, in
 * any case.
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
	// the backend lists logins and signs them out by their upper case key
	const loginKey = provider.toUpperCase();
	const sessionLogin = primaryLogin?.toUpperCase() ?? null;

	// opened blank inside the click, and sent to the sign in once any stale
	// login is gone
	const popup = window.open("", "semoss-connect", POPUP_FEATURES);
	if (!popup) {
		return Promise.reject(new PopupBlockedError());
	}

	const isConnected = async (): Promise<boolean> => {
		try {
			return loginKey in (await getLogins());
		} catch {
			return false;
		}
	};

	return (async () => {
		const wasConnected = await isConnected();
		const canSignOut =
			wasConnected && sessionLogin !== null && sessionLogin !== loginKey;
		if (canSignOut) {
			await logoutProvider(loginKey).catch(() => undefined);
		}
		// a renewed session login stays listed, so only the popup tells when
		// it is done
		const watchesLogins = !wasConnected || canSignOut;
		if (popup.closed) {
			return isConnected();
		}
		popup.location.href = getSignInUrl(loginPath);

		return waitForSignInPopup(popup, isConnected, watchesLogins);
	})();
};

/**
 * Sign in with an OAuth provider in a popup, unless the session already holds
 * its login. The sign in is done once the popup closes, comes back to this
 * app, or the provider's user info shows a name, which is read while the popup
 * is open since the backend can send the popup on to another app (see
 * {@link waitForSignInPopup}). The popup is closed then.
 *
 * @param provider - The provider's login path, such as `ms` or `google`.
 * @param isPopup - Only check for the login, without opening a popup.
 * @returns True once the session holds the login.
 * @throws PopupBlockedError when the browser blocks the popup.
 * @throws Error when the sign in ends without the login, or when only
 * checking and there is none.
 */
export const oauth = async (
	provider: string,
	isPopup = false,
): Promise<boolean> => {
	const readUserName = async (): Promise<string | undefined> => {
		const response = await get<{ name?: string }>(
			`${Env.MODULE}/api/auth/userinfo/${provider}`,
		);
		return response.data?.name;
	};

	if (await readUserName()) {
		return true;
	}
	if (isPopup) {
		throw new Error("Unable to login");
	}

	// opened from the top window, so a sign in started in an iframe still works
	const top = typeof window === "undefined" ? null : window.top;
	if (!top) {
		throw new Error("Unable to login");
	}
	const popup = top.open(
		getSignInUrl(provider),
		"_blank",
		"height=600,width=400,top=300,left=600",
	);
	if (!popup) {
		throw new PopupBlockedError();
	}

	const isSignedIn = (): Promise<boolean> =>
		readUserName().then(
			(name) => !!name,
			() => false,
		);
	if (await waitForSignInPopup(popup, isSignedIn, true)) {
		return true;
	}
	throw new Error("Unable to login");
};
