import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { type UploadedRoomFile, uploadRoomFiles } from "./upload-room-files";

const textCopySchema = z.object({ textPath: z.string().min(1) });

/**
 * Upload Office and mail files and write a text copy of each beside it, since
 * most providers reject the files themselves.
 *
 * @param actions - Actions of the insight bound to the room.
 * @param insightId - That insight's id.
 * @param files - Files that `sendsAsText` names.
 * @returns The text copies, in order, to send instead of the files.
 * @throws Error naming the file whose text could not be read.
 */
export async function uploadRoomTextCopies(
	actions: InsightActions,
	insightId: string,
	files: File[],
): Promise<UploadedRoomFile[]> {
	const copies: UploadedRoomFile[] = [];
	for (const file of await uploadRoomFiles(insightId, files)) {
		const { textPath } = await callPixel(
			actions,
			pixel("WorkAttachmentText", { filePath: file.fileLocation }),
			textCopySchema,
		);
		copies.push({
			fileName: `${file.fileName} (text)`,
			fileLocation: textPath,
		});
	}
	return copies;
}
