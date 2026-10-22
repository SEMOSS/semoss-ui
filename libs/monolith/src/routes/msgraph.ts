/**
 * Microsoft Graph change-notification subscriptions — `/msgraph`.
 *
 * Backend: `MicrosoftGraphSubscriptionService`
 * (Monolith/src/prerna/semoss/web/ms/MicrosoftGraphSubscriptionService.java),
 * registered by `MicrosoftGraphApplication`. Subscriptions are created at Graph
 * by `MicrosoftGraphSubscriptionClient` and recorded in the security database
 * by `MicrosoftGraphSubscriptionRegistry` (Semoss/src/prerna/io/connector/ms).
 *
 * Everything acts for the signed-in user's Microsoft login: 401 without a
 * platform login, 400 without a Microsoft login. A subscription belonging to
 * someone else is answered as 404. Errors are `{ status: "error", reason }`
 * bodies (no `errorMessage`, so `ApiError.message` is the generic status text;
 * read `ApiError.data`).
 */

import type { RequestOptions } from "../types";
import { del, get, post } from "../utility/http";
import { path } from "../utility/url";

/**
 * Preflight for a subscription screen: whether the user has a Microsoft login,
 * whether Graph can reach this server over public https for its validation
 * handshake, and whether the requested sign-in scopes allow subscribing to mail
 * or calendar changes. `available: true` means nothing is obviously wrong, not
 * that the tenant consented.
 *
 * @name available
 * @endpoint GET /msgraph/available
 * @source Monolith/src/prerna/semoss/web/ms/MicrosoftGraphSubscriptionService.java#available
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns Each check, the public notification base URL, and a human-readable reason for every failed check.
 * @throws {ApiError} 401 without a signed-in, non-anonymous user.
 */
export function available(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	status: "ok";
	available: boolean;
	signedIntoMicrosoft: boolean;
	publiclyReachable: boolean;
	notificationBaseUrl: string;
	canSubscribeToMail: boolean;
	canSubscribeToEvents: boolean;
	reasons: string[];
}> {
	return get(path`/msgraph/available`, params, options);
}

/**
 * Creates a Graph subscription for the user and records it. A mailbox resource
 * is delivered to the message receiver and a calendar resource to the event
 * receiver; any other resource is refused.
 *
 * @name subscribe
 * @endpoint POST /msgraph/subscribe
 * @source Monolith/src/prerna/semoss/web/ms/MicrosoftGraphSubscriptionService.java#subscribe
 * @param params - Form fields.
 * @param params.resource - What to watch, e.g. `"me/messages"` or `"me/events"`.
 * @param params.changeType - Graph change types, e.g. `"created"` (the default) or `"created,updated"`.
 * @param params.minutes - Requested lifetime in minutes; `0` / omitted for the client's default.
 * @param options - Per-call overrides (signal, headers).
 * @returns The recorded subscription, including the id that {@link renew} and {@link deleteSubscription} take.
 * @throws {ApiError} 400 without a Microsoft login or for a missing / unsupported resource, 401 without a login, 500 if Graph refuses or the record cannot be saved.
 */
export function subscribe(
	params: { resource: string; changeType?: string; minutes?: number },
	options?: RequestOptions,
): Promise<{
	status: "ok";
	subscriptionId: string;
	resource: string;
	/** The record's columns are read back as non-blank strings, so each of these may be left out. */
	changeType?: string;
	notificationUrl?: string;
	/** The subscriber's Microsoft login id. */
	userId?: string;
	/** Always `MICROSOFT` when recorded here. */
	userProvider?: string;
	/** ISO instant; absent when Graph did not say. */
	expirationDateTime?: string;
}> {
	return post(path`/msgraph/subscribe`, params, options);
}

/**
 * Extends one of the user's subscriptions at Graph, then updates the record.
 * Must happen before it expires; an expired subscription has to be recreated.
 *
 * @name renew
 * @endpoint POST /msgraph/renew
 * @source Monolith/src/prerna/semoss/web/ms/MicrosoftGraphSubscriptionService.java#renew
 * @param params - Form fields.
 * @param params.subscriptionId - The subscription.
 * @param params.minutes - New lifetime in minutes; `0` / omitted for the client's default.
 * @param options - Per-call overrides (signal, headers).
 * @returns The subscription as it is now.
 * @throws {ApiError} 400 without a Microsoft login or `subscriptionId`, 401 without a login, 404 if it is not one of the user's, 500 if Graph refuses.
 */
export function renew(
	params: { subscriptionId: string; minutes?: number },
	options?: RequestOptions,
): Promise<{
	status: "ok";
	subscriptionId: string;
	resource: string;
	changeType?: string;
	notificationUrl?: string;
	userId?: string;
	userProvider?: string;
	expirationDateTime?: string;
}> {
	return post(path`/msgraph/renew`, params, options);
}

/**
 * Stops one of the user's subscriptions at Graph, then forgets it.
 *
 * @name deleteSubscription
 * @endpoint DELETE /msgraph/subscription
 * @source Monolith/src/prerna/semoss/web/ms/MicrosoftGraphSubscriptionService.java#unsubscribe
 * @param params - Query parameters.
 * @param params.subscriptionId - The subscription.
 * @param options - Per-call overrides (signal, headers).
 * @returns The stopped subscription id.
 * @throws {ApiError} 400 without a Microsoft login or `subscriptionId`, 401 without a login, 404 if it is not one of the user's, 500 if Graph refuses.
 */
export function deleteSubscription(
	params: { subscriptionId: string },
	options?: RequestOptions,
): Promise<{ status: "ok"; subscriptionId: string; deleted: true }> {
	return del(path`/msgraph/subscription`, params, options);
}

/**
 * Lists the user's subscriptions both as recorded here and as Graph holds
 * them. A record missing at Graph has expired or was stopped; one at Graph with
 * no record cannot be acted on.
 *
 * @name subscriptions
 * @endpoint GET /msgraph/subscriptions
 * @source Monolith/src/prerna/semoss/web/ms/MicrosoftGraphSubscriptionService.java#subscriptions
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `recorded` from the security database, and `atMicrosoft` — Graph's raw subscription objects, or an `"unavailable: …"` string when Graph cannot be read.
 * @throws {ApiError} 400 without a Microsoft login, 401 without a login.
 */
export function subscriptions(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	status: "ok";
	/** `Subscription.describe()` of each record, as {@link subscribe} returns it. */
	recorded: Array<{
		subscriptionId: string;
		resource: string;
		changeType?: string;
		notificationUrl?: string;
		userId?: string;
		userProvider?: string;
		expirationDateTime?: string;
	}>;
	/** Graph's subscription objects as Microsoft returns them, or `"unavailable: <reason>"`. */
	atMicrosoft: Array<Record<string, unknown>> | string;
}> {
	return get(path`/msgraph/subscriptions`, params, options);
}
