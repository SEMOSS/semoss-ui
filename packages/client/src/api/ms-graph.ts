import { Env } from "@semoss/sdk/react";

/**
 * What the deployment can do about Microsoft Graph subscriptions right now, as
 * returned by `/msgraph/available`.
 *
 * Three things have to line up and each fails differently, so the screen shows
 * `reasons` rather than a bare disabled button. `available: true` means nothing
 * is obviously wrong, not that Microsoft will agree: the backend can see the
 * scopes this deployment *asks* for, never what the tenant consented to.
 */
export interface MsGraphAvailability {
	/** Whether a subscription can be attempted at all. */
	available: boolean;
	/** Whether the signed-in user has a Microsoft login on their account. */
	signedIntoMicrosoft: boolean;
	/** Whether Microsoft can reach this deployment to run its validation handshake. */
	publiclyReachable: boolean;
	/** Where Microsoft would post notifications, shown when it cannot reach us. */
	notificationBaseUrl?: string;
	/** Whether a configured scope permits subscribing to the mailbox. */
	canSubscribeToMail: boolean;
	/** Whether a configured scope permits subscribing to the calendar. */
	canSubscribeToEvents: boolean;
	/** Human-readable blockers, empty when everything is in place. */
	reasons: string[];
}

/** One Microsoft Graph subscription, as this deployment recorded it. */
export interface MsGraphSubscription {
	subscriptionId: string;
	/** What it watches, such as `me/messages` or `me/events`. */
	resource: string;
	/** Which changes it hears about: `created`, `updated`, `deleted`. */
	changeType?: string;
	/** Where Microsoft posts its notifications. */
	notificationUrl?: string;
	/** When Microsoft stops sending unless it is renewed first. */
	expirationDateTime?: string;
	userId?: string;
	userProvider?: string;
}

/** The two resources this deployment has receivers for. */
export type MsGraphResource = "me/messages" | "me/events";

interface MsGraphErrorBody {
	status?: string;
	reason?: string;
}

const buildUrl = (path: string, params?: Record<string, string>): string => {
	const url = new URL(`${Env.MODULE}${path}`, window.location.origin);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
	}
	return url.toString();
};

const readJson = async (response: Response): Promise<unknown> =>
	response.json().catch(() => null);

/**
 * Throws on a failed response, carrying the backend `reason` so the caller can
 * surface what Microsoft actually objected to rather than a status code.
 */
const throwIfError = (
	response: Response,
	body: MsGraphErrorBody | null,
): void => {
	if (!response.ok || body?.status === "error") {
		throw new Error(body?.reason || `Request failed (${response.status})`);
	}
};

/**
 * Pre-flight for the subscriptions section. Resolves to an unavailable state
 * rather than throwing, so the screen can explain itself even when the call
 * fails outright.
 */
export const getMsGraphAvailability =
	async (): Promise<MsGraphAvailability> => {
		try {
			const response = await fetch(buildUrl("/msgraph/available"), {
				method: "GET",
				credentials: "include",
				headers: { Accept: "application/json" },
			});
			const body = (await readJson(
				response,
			)) as MsGraphAvailability | null;
			if (!response.ok || !body) {
				throw new Error("unavailable");
			}
			return body;
		} catch {
			return {
				available: false,
				signedIntoMicrosoft: false,
				publiclyReachable: false,
				canSubscribeToMail: false,
				canSubscribeToEvents: false,
				reasons: [
					"Could not check whether Microsoft subscriptions are set up.",
				],
			};
		}
	};

/**
 * The signed-in user's subscriptions as this deployment recorded them.
 *
 * The backend also reports what Microsoft itself holds, which can differ when a
 * subscription expired or was created elsewhere. Only the recorded ones are
 * actionable here, since those are the ones this deployment can receive
 * notifications for.
 */
export const listMsGraphSubscriptions = async (): Promise<
	MsGraphSubscription[]
> => {
	const response = await fetch(buildUrl("/msgraph/subscriptions"), {
		method: "GET",
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	const body = (await readJson(response)) as
		| (MsGraphErrorBody & { recorded?: MsGraphSubscription[] })
		| null;
	throwIfError(response, body);
	return body?.recorded ?? [];
};

/**
 * Starts watching a resource for the signed-in user.
 *
 * @param resource what to watch
 * @param changeType which changes to hear about, defaulting to `created`
 */
export const createMsGraphSubscription = async (
	resource: MsGraphResource,
	changeType = "created",
): Promise<MsGraphSubscription> => {
	const response = await fetch(
		buildUrl("/msgraph/subscribe", { resource, changeType }),
		{
			method: "POST",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as
		| (MsGraphErrorBody & MsGraphSubscription)
		| null;
	throwIfError(response, body);
	return body as MsGraphSubscription;
};

/** Stops a subscription and forgets it. */
export const deleteMsGraphSubscription = async (
	subscriptionId: string,
): Promise<void> => {
	const response = await fetch(
		buildUrl("/msgraph/subscription", { subscriptionId }),
		{
			method: "DELETE",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as MsGraphErrorBody | null;
	throwIfError(response, body);
};
