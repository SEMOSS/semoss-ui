import { uploadInsight } from "@semoss/sdk";
import { z } from "@semoss/ui/next";

const uploadedFileSchema = z.object({
	fileName: z.string(),
	fileLocation: z.string(),
});

const uploadedFilesSchema = z.array(uploadedFileSchema);

export type UploadedRoomFile = z.infer<typeof uploadedFileSchema>;

/** Upload composer files and return the media locations accepted by RunAgent. */
export async function uploadRoomFiles(
	insightId: string,
	files: File[],
): Promise<UploadedRoomFile[]> {
	if (files.length === 0) return [];

	const response = await uploadInsight(insightId, "", files);
	const parsed = uploadedFilesSchema.safeParse(response.data);
	if (!parsed.success || parsed.data.length !== files.length) {
		throw new Error("One or more attachments could not be uploaded.");
	}

	return parsed.data;
}
