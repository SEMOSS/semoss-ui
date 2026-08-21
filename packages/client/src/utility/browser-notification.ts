/**
 * localStorage key holding the user's notification preference. Uses the
 * `smss--<name>` format and `{ state }` payload shape of `useCacheState`
 * (libs/ui/src/hooks/use-cache-state.ts) so the two stay interchangeable.
 */
const STORAGE_KEY = "smss--browser-notifications";

/** Options for a single browser notification. */
export interface BrowserNotificationOptions {
	/** Notification headline. */
	title: string;
	/** Secondary body text shown under the title. */
	body?: string;
	/** URL of the image shown alongside the notification. */
	icon?: string;
	/**
	 * Collapse key — a later notification carrying the same tag replaces the
	 * earlier one instead of stacking a second banner.
	 */
	tag?: string;
	/** Called when the user clicks the notification, after the window refocuses. */
	onClick?: () => void;
}

/** Preference cache; null until first read from localStorage. */
let enabled: boolean | null = null;

/** In-flight permission request, so concurrent callers share one dialog. */
let permissionRequest: Promise<NotificationPermission> | null = null;

/**
 * Whether the user is currently looking at this page. False when the tab is
 * backgrounded or minimized *and* when the window is open but another
 * application holds focus — the case that matters most for a long agent run
 * you have alt-tabbed away from.
 *
 * @name isPageActive
 * @return Whether the page is both visible and focused.
 */
export const isPageActive = (): boolean => {
	if (typeof document === "undefined") return false;
	return document.visibilityState === "visible" && document.hasFocus();
};

/**
 * Whether the Notification API is available. Checks that the constructor is
 * actually callable rather than merely present — `"Notification" in window` is
 * true even when the value is undefined.
 *
 * @name isBrowserNotificationSupported
 * @return Whether `window.Notification` is a usable constructor.
 */
export const isBrowserNotificationSupported = (): boolean =>
	typeof window !== "undefined" && typeof window.Notification === "function";

/**
 * Read the persisted preference, defaulting to on. Lazy rather than
 * module-load so importing this file stays safe without a DOM.
 *
 * @name readEnabled
 * @return Whether notifications are switched on.
 */
const readEnabled = (): boolean => {
	if (enabled !== null) return enabled;

	enabled = true;
	try {
		const item = localStorage.getItem(STORAGE_KEY);
		if (item) {
			const parsed: unknown = JSON.parse(item);
			const state =
				typeof parsed === "object" && parsed !== null
					? (parsed as { state?: unknown }).state
					: undefined;
			if (typeof state === "boolean") {
				enabled = state;
			}
		}
	} catch (error) {
		console.warn("Unable to read the notification preference:", error);
	}
	return enabled;
};

/**
 * Switch notifications on or off and persist the choice. There is no UI for
 * this yet, so it is currently only reachable programmatically — it is what
 * makes the preference check inside `notifyIfPageInactive` meaningful, and the
 * hook a settings toggle would call.
 *
 * @name setBrowserNotificationsEnabled
 * @param isEnabled - Whether notifications should fire.
 */
export const setBrowserNotificationsEnabled = (isEnabled: boolean): void => {
	enabled = isEnabled;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: isEnabled }));
	} catch (error) {
		console.warn("Unable to persist the notification preference:", error);
	}
};

/**
 * Request notification permission if it has not been decided yet. Must be
 * called from a user gesture — Safari rejects the request otherwise. Repeat
 * calls are deduped, so it is safe to call on every send.
 *
 * @name ensureBrowserNotificationPermission
 * @return The resulting permission; "denied" when unsupported.
 */
export const ensureBrowserNotificationPermission =
	async (): Promise<NotificationPermission> => {
		if (!isBrowserNotificationSupported()) return "denied";
		if (Notification.permission !== "default") {
			return Notification.permission;
		}
		if (permissionRequest) return permissionRequest;

		// Held in a local as well, so the `finally` clearing the shared slot
		// cannot race the return value.
		const request = Notification.requestPermission()
			.catch((error): NotificationPermission => {
				console.warn("Notification permission request failed:", error);
				return "denied";
			})
			.finally(() => {
				permissionRequest = null;
			});
		permissionRequest = request;

		return request;
	};

/**
 * Show a notification, but only while the user is away from the page. Silent
 * when notifications are switched off, permission is not granted, or the page
 * is active — so an attentive user never sees one.
 *
 * @name notifyIfPageInactive
 * @param options - Title, body, collapse tag, and click handler.
 * @return Whether a notification was actually shown.
 */
export const notifyIfPageInactive = (
	options: BrowserNotificationOptions,
): boolean => {
	if (!isBrowserNotificationSupported()) return false;
	if (!readEnabled()) return false;
	if (Notification.permission !== "granted") return false;
	if (isPageActive()) return false;

	try {
		const notification = new Notification(options.title, {
			body: options.body,
			icon: options.icon,
			tag: options.tag,
		});
		notification.onclick = () => {
			window.focus();
			notification.close();
			options.onClick?.();
		};
		return true;
	} catch (error) {
		// Some platforms (notably Android Chrome, which requires a service
		// worker) throw from the constructor. Never break the caller.
		console.warn("Unable to show a browser notification:", error);
		return false;
	}
};
