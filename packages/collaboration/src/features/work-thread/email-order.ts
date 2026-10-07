const EMAIL_ORDER_KEY = "collaboration.emailOrder";

export type EmailOrder = "oldest" | "newest";

/** The order this browser last picked in the Emails panel; newest first until then. */
export function readEmailOrder(): EmailOrder {
	try {
		return window.localStorage.getItem(EMAIL_ORDER_KEY) === "oldest"
			? "oldest"
			: "newest";
	} catch {
		return "newest";
	}
}

export function rememberEmailOrder(order: EmailOrder): void {
	try {
		window.localStorage.setItem(EMAIL_ORDER_KEY, order);
	} catch {
		// storage can be full or blocked; the pick still applies to this session
	}
}
