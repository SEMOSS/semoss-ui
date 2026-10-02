import { runPixel } from "@semoss/sdk";
import { decodeBase64Asset } from "@semoss/shared";
import { pixel } from "@/lib/pixel";
import type { PresentationReference } from "../presentation-run";
import { presentationPath } from "../presentation-tools";

/** Read the actual file in the bound room; a path or download ticket alone is not delivery. */
export async function retrievePresentation(
	insightId: string,
	roomId: string,
	file: PresentationReference,
): Promise<Uint8Array<ArrayBuffer>> {
	if (
		!insightId ||
		!roomId ||
		roomId !== file.roomId ||
		!presentationPath(file.path)
	)
		throw new Error(
			"This presentation belongs to a different or unavailable conversation.",
		);
	const response = await runPixel<[unknown]>(
		pixel("GetInsightAssetsBase64", { filePath: file.path }),
		insightId,
	);
	if (response.errors.length)
		throw new Error(
			"This presentation is unavailable. It may have been moved or deleted.",
		);
	const output = response.pixelReturn[0]?.output;
	const decoded =
		typeof output === "string" ? decodeBase64Asset(output) : null;
	if (!decoded?.length)
		throw new Error("The presentation file could not be retrieved.");
	const bytes = new Uint8Array(decoded);
	if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
		throw new Error("The retrieved file is not a PowerPoint presentation.");
	return bytes;
}

/** Download the bytes just verified, so a missing file cannot produce a false success. */
export function savePresentation(
	bytes: Uint8Array<ArrayBuffer>,
	name: string,
): void {
	const url = URL.createObjectURL(
		new Blob([bytes], {
			type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		}),
	);
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
