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
