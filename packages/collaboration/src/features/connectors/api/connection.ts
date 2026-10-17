import { Env } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const connectionSchema = z.object({
	microsoft: z.object({
		signedIn: z.boolean(),
		account: z.string().nullish(),
		renewable: z.boolean(),
	}),
	// the mailbox the Brain reads, linked by the first import
	mailbox: z.string().nullish(),
	background: z.object({
		saved: z.boolean(),
		account: z.string().nullish(),
		renewable: z.boolean(),
		canSave: z.boolean(),
		otherAccount: z.boolean(),
	}),
	sources: z.array(
		z.object({
			id: z.string(),
			label: z.string(),
			status: z.enum(["off", "connected", "needs_permission"]),
			lastSync: z.string().nullish(),
		}),
	),
	// which Outlook folders mail is read from; known is false before the first import reads them
	folders: z
		.object({
			known: z.boolean(),
			read: z.number(),
			custom: z.number(),
			linked: z.number(),
			updatedAt: z.string().nullish(),
		})
		.nullish(),
});
export type Connection = z.infer<typeof connectionSchema>;

/** Sign-in, linked mailbox, background access and per-source status; never tokens. */
export function getConnection(actions: InsightActions): Promise<Connection> {
	return callPixel(actions, pixel("BrainGetConnection"), connectionSchema);
}

/** Keep this sign-in so routines and refresh can read mail with the page closed. */
export function saveBackgroundAccess(
	actions: InsightActions,
): Promise<Connection> {
	return callPixel(
		actions,
		pixel("BrainSaveBackgroundAccess"),
		connectionSchema,
	);
}

/** Remove the saved background access; scheduled routines stop. */
export function forgetBackgroundAccess(
	actions: InsightActions,
): Promise<Connection> {
	return callPixel(
		actions,
		pixel("BrainForgetBackgroundAccess"),
		connectionSchema,
	);
}

const availabilitySchema = z.object({
	available: z.boolean(),
	publiclyReachable: z.boolean(),
	reasons: z.array(z.string()),
});
export type NotificationAvailability = z.infer<typeof availabilitySchema>;

const subscriptionSchema = z.object({
	subscriptionId: z.string(),
	resource: z.string(),
	expirationDateTime: z.string().nullish(),
});
export type NotificationSubscription = z.infer<typeof subscriptionSchema>;

const errorSchema = z
	.object({ status: z.string().optional(), reason: z.string().optional() })
	.nullable();

// the Microsoft Graph subscription service is a REST endpoint, not a reactor
async function msgraph(
	path: string,
	params: Record<string, string> = {},
	method = "GET",
): Promise<unknown> {
	const url = new URL(`${Env.MODULE}/msgraph${path}`, window.location.origin);
	for (const [key, value] of Object.entries(params))
		url.searchParams.set(key, value);
	const response = await fetch(url, {
		method,
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	const body: unknown = await response.json().catch(() => null);
	const error = errorSchema.safeParse(body);
	if (!response.ok || (error.success && error.data?.status === "error"))
		throw new Error(
			(error.success && error.data?.reason) ||
				`Microsoft notifications request failed (${response.status})`,
		);
	return body;
}

/** Whether Microsoft can notify this server, and why not. */
export async function getNotificationAvailability(): Promise<NotificationAvailability> {
	try {
		return availabilitySchema.parse(await msgraph("/available"));
	} catch {
		return {
			available: false,
			publiclyReachable: false,
			reasons: [
				"Could not check whether Microsoft notifications are set up.",
			],
		};
	}
}

/** The signed-in user's notification subscriptions this server can receive. */
export async function listNotificationSubscriptions(): Promise<
	NotificationSubscription[]
> {
	const body = z
		.object({ recorded: z.array(subscriptionSchema).optional() })
		.parse(await msgraph("/subscriptions"));
	return body.recorded ?? [];
}

/** Stop one subscription. */
export async function removeNotificationSubscription(
	subscriptionId: string,
): Promise<void> {
	await msgraph("/subscription", { subscriptionId }, "DELETE");
}

/** A readable name for a Graph resource path. */
export function notificationLabel(resource: string): string {
	if (/mailFolders\('inbox'\)/i.test(resource)) return "Inbox";
	if (/mailFolders\('sentitems'\)/i.test(resource)) return "Sent Items";
	if (/messages$/i.test(resource)) return "All mail";
	if (/events$/i.test(resource)) return "Calendar";
	return resource;
}
