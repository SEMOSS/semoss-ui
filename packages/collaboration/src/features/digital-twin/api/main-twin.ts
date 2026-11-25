import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const savedSchema = z.object({
	name: z.string().min(1),
	image: z.string().min(1).optional(),
});

/** A person's own Digital Twin as a save answers it: its name now, and its picture as bare base64 when it keeps one. */
type SavedMainTwin = z.infer<typeof savedSchema>;

/** The longer side of the picture the server keeps, in pixels. */
const PICTURE_SIZE = 192;

// Draws the picture no larger than the server keeps it, so an upload and a generated option go the same way and
// neither sends more than is kept. A smaller picture is not enlarged.
async function shrink(file: File): Promise<string> {
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		// what the server says of a file it cannot read
		throw new Error("That picture could not be read. Choose another one.");
	}
	try {
		const scale = Math.min(
			1,
			PICTURE_SIZE / Math.max(bitmap.width, bitmap.height),
		);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		const context = canvas.getContext("2d");
		if (!context)
			throw new Error(
				"That picture could not be read. Choose another one.",
			);
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		// the server takes the picture bare, without the address prefix. A canvas that could not be encoded
		// gives an empty one, and an empty picture is how a save removes the one that is kept
		const picture = canvas.toDataURL("image/png").split(",")[1];
		if (!picture)
			throw new Error(
				"That picture could not be read. Choose another one.",
			);
		return picture;
	} finally {
		bitmap.close();
	}
}

/**
 * Save the name, the picture, or both of the signed-in person's own Digital
 * Twin. What is left out stays as it is.
 *
 * @param changes - `name`: the new name, or empty to go back to the default.
 * `image`: a picture to keep, or empty to go back to the Microsoft photo.
 * @returns The twin as the server now holds it.
 * @throws {PixelError} with the server's reason when it refuses the save.
 */
export async function saveMainTwin(
	actions: InsightActions,
	changes: { name?: string; image?: File | "" },
): Promise<SavedMainTwin> {
	const image =
		changes.image instanceof File
			? await shrink(changes.image)
			: changes.image;
	// shortcut: the picture rides in the pixel call, at most about 200,000 characters at this size; give it an
	// upload of its own if pictures grow. META keeps the call, and so the picture, out of the insight's list of calls.
	return callPixel(
		actions,
		`META | ${pixel("WorkSaveMainTwin", { name: changes.name, image })}`,
		savedSchema,
	);
}
