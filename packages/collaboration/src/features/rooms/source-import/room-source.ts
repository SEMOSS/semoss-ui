import { z } from "@semoss/ui/next";

/** Source identities retained with a room; message bodies live in its file. */
export const roomSourceSchema = z.object({
	version: z.literal(1),
	threadId: z.string().min(1),
	title: z.string(),
	channel: z.enum(["email", "teams", "calendar", "room", "task"]),
	kind: z.enum(["brain", "outlook", "teams", "calendar", "sample"]),
	nativeId: z.string().min(1).optional(),
	webLink: z
		.url()
		.refine((value) => value.startsWith("https://"))
		.optional(),
	file: z.object({
		fileLocation: z.string().min(1),
		fileName: z.string().min(1),
	}),
	messages: z.array(
		z.object({
			id: z.string().min(1),
			subject: z.string().optional(),
			fromName: z.string().optional(),
			fromAddress: z.string().optional(),
			to: z.array(z.string()).optional(),
			cc: z.array(z.string()).optional(),
			at: z.string(),
		}),
	),
});

export type RoomSource = z.infer<typeof roomSourceSchema>;

/** Whether a room's source has messages its reader can load: an email or a Teams chat. */
export function canReadRoomSource(source: RoomSource | null): boolean {
	if (!source?.messages.length) return false;
	if (source.channel === "email")
		return source.kind === "brain" || source.kind === "outlook";
	return (
		source.channel === "teams" &&
		(source.kind === "brain" || source.kind === "teams")
	);
}
